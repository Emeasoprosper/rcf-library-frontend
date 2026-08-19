// components/ui/InstallPrompt.jsx
//
// Shown once per page load, before the user does anything else.
// Android status is now a real check against public/version.json — see
// getApkInstallStatus in pwaInstall.js. No more permanent "ever
// installed" guess: this correctly distinguishes never-installed,
// out-of-date, and up-to-date.
import { useEffect, useState } from 'react'
import {
  canPromptInstall,
  triggerInstall,
  downloadApk,
  tryOpenInstalledAndroidApp,
  getApkInstallStatus,
  isAndroid,
  isIos,
  isIosSafari,
  isRunningAsInstalledApp,
} from '../../lib/pwaInstall'

function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [apkDownloaded, setApkDownloaded] = useState(false)
  const [status, setStatus] = useState(null)
  const android = isAndroid()

  useEffect(() => {
    if (isRunningAsInstalledApp()) return
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible || !android) return
    let cancelled = false
    getApkInstallStatus().then((s) => { if (!cancelled) setStatus(s) })
    return () => { cancelled = true }
  }, [visible, android])

  if (!visible) return null

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

  const handleCancel = () => setVisible(false)

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline p-stack-lg">
        {apkDownloaded ? (
          <>
            <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">download_done</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">APK downloaded</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Open the downloaded file from your notifications or Downloads folder, then tap Install (or Update) to
              finish setting up the app.
            </p>
            <button
              onClick={handleCancel}
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
                A newer version of the app is available. Download and install it to get the latest version.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Download Update
                </button>
                <button
                  onClick={handleCancel}
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
                The app is already installed on your device. Open the installed app to access your downloaded
                materials and continue using the full app experience.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinueToApp}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Continue to App
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">android</span>
              <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Install App</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
                Install the app to access downloaded materials and use the app offline.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
                >
                  Install App
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
                >
                  Cancel
                </button>
              </div>
            </>
          )
        ) : (
          <>
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">install_mobile</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Install App</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Install the app to access downloaded materials and use the app offline.
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
                onClick={handleCancel}
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

export default InstallPrompt