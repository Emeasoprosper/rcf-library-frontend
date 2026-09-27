import { useState, useEffect, useCallback } from 'react'

// Storage API's estimate() only exists in Chromium/Firefox-based browsers
// with reasonable support today — iOS Safari support is inconsistent
// across versions. Where it's missing, this reports 'unknown' rather than
// guessing, so the UI never shows a false "low storage" warning it can't
// actually back up.
const LOW_STORAGE_THRESHOLD_BYTES = 100 * 1024 * 1024 // 100MB free or less

export function useStorageStatus() {
  const [status, setStatus] = useState({ state: 'unknown', usedBytes: 0, quotaBytes: 0, freeBytes: 0 })

  const check = useCallback(async () => {
    if (!navigator.storage?.estimate) {
      setStatus({ state: 'unknown', usedBytes: 0, quotaBytes: 0, freeBytes: 0 })
      return
    }
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate()
      const free = quota - usage
      setStatus({
        state: free < LOW_STORAGE_THRESHOLD_BYTES ? 'low' : 'ok',
        usedBytes: usage,
        quotaBytes: quota,
        freeBytes: free,
      })
    } catch {
      setStatus({ state: 'unknown', usedBytes: 0, quotaBytes: 0, freeBytes: 0 })
    }
  }, [])

  useEffect(() => {
    check()
    // Re-check whenever the tab regains focus — catches storage freed up
    // (or filled up) elsewhere on the device without polling in the
    // background the whole time the app is open.
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [check])

  return status
}