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