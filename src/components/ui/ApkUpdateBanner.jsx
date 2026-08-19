// components/ui/ApkUpdateBanner.jsx
//
// Runs ONLY inside the installed Android app (isRunningAsInstalledApp()
// + isAndroid()) — the plain website never shows this. Checks
// public/version.json against the version this device last downloaded:
//   - on app open
//   - whenever the app returns to the foreground (visibilitychange —
//     covers "left the app running in the background, came back later")
//   - every 30 minutes while the app stays open, as a safety net
//
// Shows a small dismissible banner, NOT a blocking modal — the person
// should be able to keep using the app and update whenever convenient.
// Dismissing hides it only for the current session; it reappears next
// time the app is opened if still out of date, so it doesn't nag
// mid-session but also doesn't get permanently silenced by one tap.
import { useState, useEffect, useCallback } from 'react'
import { getApkInstallStatus, downloadApk, isAndroid, isRunningAsInstalledApp } from '../../lib/pwaInstall'

const CHECK_INTERVAL_MS = 30 * 60 * 1000

function ApkUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const runCheck = useCallback(async () => {
    if (!isAndroid() || !isRunningAsInstalledApp()) return
    const status = await getApkInstallStatus()
    if (status === 'update') setUpdateAvailable(true)
  }, [])

  useEffect(() => {
    runCheck()

    function handleVisibility() {
      if (document.visibilityState === 'visible') runCheck()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(runCheck, CHECK_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [runCheck])

  if (!updateAvailable || dismissed) return null

  const handleUpdate = async () => {
    setDownloading(true)
    try {
      await downloadApk()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[130] px-margin-mobile pt-[calc(env(safe-area-inset-top)+8px)] pb-2">
      <div className="flex items-center gap-3 bg-primary text-on-primary rounded-xl px-4 py-3 shadow-lg">
        <span className="material-symbols-outlined text-xl flex-none">system_update</span>
        <p className="font-label-md text-label-md flex-1 min-w-0">
          A new version of the app is available.
        </p>
        <button
          onClick={handleUpdate}
          disabled={downloading}
          className="flex-none px-3 py-1.5 rounded-full bg-on-primary text-primary font-label-sm text-label-sm font-semibold disabled:opacity-60"
        >
          {downloading ? 'Downloading…' : 'Update'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="flex-none w-6 h-6 flex items-center justify-center opacity-80"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}

export default ApkUpdateBanner