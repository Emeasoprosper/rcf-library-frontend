// RCFMOUAULIBRARYreact/student-dashboard/src/hooks/useNetworkStatus.js
import { useState, useEffect, useRef, useCallback } from 'react'

const SLOW_FETCH_THRESHOLD_MS = 5000

// Tracks browser online/offline state via the native events. This is
// connectivity-to-the-internet at the OS/browser level, not "can reach our
// API" — good enough to gate whether we should even attempt a network
// fetch vs falling back to an offline copy.
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    function handleOnline() { setIsOnline(true) }
    function handleOffline() { setIsOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Speed classification. Uses the real Network Information API where the
// browser supports it (Chrome/Edge/Android — NOT Safari or Firefox, no
// browser exposes this everywhere). Where it isn't available, falls back
// to timing a tiny real request (the app's own favicon, ~1KB, already
// cached rarely so it reflects a real round-trip) and classifying by how
// long that takes. Either way returns one of: 'fast' | 'medium' | 'slow'
// | 'offline' | 'unknown' (unknown only while the first check is still
// in flight).
const EFFECTIVE_TYPE_MAP = {
  '4g': 'fast',
  '3g': 'medium',
  '2g': 'slow',
  'slow-2g': 'slow',
}

async function measureFallbackSpeed() {
  const start = performance.now()
  try {
    await fetch(`/favicon.ico?_=${Date.now()}`, { cache: 'no-store' })
    const elapsed = performance.now() - start
    if (elapsed < 400) return 'fast'
    if (elapsed < 1500) return 'medium'
    return 'slow'
  } catch {
    return 'unknown'
  }
}

export function useConnectionQuality() {
  const isOnline = useNetworkStatus()
  const [quality, setQuality] = useState('unknown')

  useEffect(() => {
    if (!isOnline) {
      setQuality('offline')
      return
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection?.effectiveType) {
      const update = () => setQuality(EFFECTIVE_TYPE_MAP[connection.effectiveType] || 'unknown')
      update()
      connection.addEventListener?.('change', update)
      return () => connection.removeEventListener?.('change', update)
    }

    // No Network Information API support (Safari, Firefox) — measure once
    // now, and re-measure whenever the tab regains focus, since that's a
    // reasonable, low-cost moment to recheck without polling constantly.
    let cancelled = false
    measureFallbackSpeed().then((q) => { if (!cancelled) setQuality(q) })
    const onFocus = () => measureFallbackSpeed().then((q) => { if (!cancelled) setQuality(q) })
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [isOnline])

  return quality
}

// Doesn't cancel or time out the fetch itself — just flips `isSlow` to true
// if the operation hasn't finished within `thresholdMs`, so the UI can show
// a "this is taking a while" banner instead of a silent frozen screen.
// Usage: call start() right before the fetch, stop() in a finally block.
export function useSlowFetchWarning(thresholdMs = SLOW_FETCH_THRESHOLD_MS) {
  const [isSlow, setIsSlow] = useState(false)
  const timeoutRef = useRef(null)

  const start = useCallback(() => {
    setIsSlow(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsSlow(true), thresholdMs)
  }, [thresholdMs])

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setIsSlow(false)
  }, [])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  return { isSlow, start, stop }
}