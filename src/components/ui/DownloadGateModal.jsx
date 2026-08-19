// components/ui/DownloadGateModal.jsx
import { useState, useEffect } from 'react'
import {
  canPromptInstall,
  triggerInstall,
  downloadApk,
  tryOpenInstalledAndroidApp,
  getApkInstallStatus,
  isAndroid,
  isIos,
  isIosSafari,
} from '../../lib/pwaInstall'

// Blocking popup shown the moment a Download action is attempted outside
// the installed app. Nothing is fetched before or during this modal.
//
// Android status is now a real check against public/version.json, not a
// permanent "ever installed" localStorage guess — see getApkInstallStatus
// in pwaInstall.js. Three real states: 'install' (never downloaded),
// 'update' (downloaded an older version), 'current' (up to date).
function DownloadGateModal({ open, onClose }) {
  const [installing, setInstalling] = useState(false)
  const [apkDownloaded, setApkDownloaded] = useState(false)
  const [status, setStatus] = useState(null) // null while checking
  const android = isAndroid()

  useEffect(() => {
    if (!open || !android) return
    let cancelled = false
    setStatus(null)
    getApkInstallStatus().then((s) => { if (!cancelled) setStatus(s) })
    return () => { cancelled = true }
  }, [open, android])

  if (!open) return null

  const ios = isIos()
  const iosButNotSafari = ios && !isIosSafari()
  const canPrompt = canPromptInstall()

  const handleDownloadApk = async () => {
    await downloadApk()
    setApkDownloaded(true)
  }

  const handleContinueToApp = () => {
    if (android) {
      tryOpenInstalledAndroidApp()
    } else {
      window.location.href = window.location.origin + '/'
    }
  }

  const handleInstallPwa = async () => {
    if (!canPrompt) return
    setInstalling(true)
    try {
      await triggerInstall()
    } finally {
      setInstalling(false)
    }
  }

  const handleClose = () => {
    setApkDownloaded(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline p-stack-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {apkDownloaded ? (
          <>
            <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">download_done</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">APK downloaded</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Open the downloaded file from your notifications or Downloads folder, then tap Install (or Update).
              Once it's done, open the app and tap Download again — downloads only work inside the installed app.
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
            >
              Got it
            </button>
          </>
        ) : android ? (
          status === null ? (
            <>
              <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm animate-spin">progress_activity</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Checking app version…</p>
            </>
          ) : status === 'update' ? (
            <>
              <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">system_update</span>
              <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Update Available</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                A newer version of the app is available. Download it and reinstall to get the latest version before
                downloading this material.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Download Update
                </button>
                <button
                  onClick={handleClose}
                  className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : status === 'current' || status === 'unknown' ? (
            <>
              <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">check_circle</span>
              <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Continue to App</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                You already have the app installed. Continue to the app to download and access this material offline.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinueToApp}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Continue to App
                </button>
                <button
                  onClick={handleClose}
                  className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
                >
                  Cancel
                </button>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-stack-sm">
                Not installed anymore, or this button didn't open the app?{' '}
                <button onClick={handleDownloadApk} className="text-primary underline">
                  Download the app again
                </button>
                .
              </p>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">android</span>
              <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Install App</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                You need the app before you can download this material. Install the Android app to save materials
                and read them offline.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Install App
                </button>
                <button
                  onClick={handleClose}
                  className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
                >
                  Cancel
                </button>
              </div>
            </>
          )
        ) : (
          <>
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">download_for_offline</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Download Unavailable</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              You need to install and open the app before you can download materials for offline reading.
            </p>

            {iosButNotSafari && (
              <p className="font-label-sm text-label-sm text-error mb-stack-sm">
                This link was opened outside Safari. On iPhone/iPad, open this site in Safari to install the app.
              </p>
            )}

            <div className="mb-stack-md rounded-xl bg-surface-container-high p-3 flex flex-col gap-2">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">iPhone / iPad (Safari):</span> Tap the Share icon, then "Add to Home Screen".
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Desktop:</span> Look for an install icon in the address bar, or check the browser menu for "Install app".
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {canPrompt && (
                <button
                  onClick={handleInstallPwa}
                  disabled={installing}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg disabled:opacity-60"
                >
                  {installing ? 'Installing…' : 'Install App'}
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DownloadGateModal