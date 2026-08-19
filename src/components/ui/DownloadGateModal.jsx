// components/ui/DownloadGateModal.jsx
import { useState } from 'react'
import {
  canPromptInstall,
  triggerInstall,
  downloadApk,
  tryOpenInstalledAndroidApp,
  isAndroid,
  isIos,
  isIosSafari,
  wasEverOpenedApk,
} from '../../lib/pwaInstall'

// Blocking popup shown the moment a Download action is attempted outside
// the installed app. Nothing is fetched before or during this modal.
//
// Android's primary path is now the real signed APK, not the browser's
// PWA install prompt. iOS/desktop still use the PWA path since there is
// no APK for those platforms.
function DownloadGateModal({ open, onClose }) {
  const [installing, setInstalling] = useState(false)
  const [apkDownloaded, setApkDownloaded] = useState(false)

  if (!open) return null

  const android = isAndroid()
  const ios = isIos()
  const iosButNotSafari = ios && !isIosSafari()
  const canPrompt = canPromptInstall()
  // Soft signal only, used for copy — actual gating still happens via
  // isRunningAsInstalledApp() in the caller (ResourceDetail), which is
  // the only thing that actually allows a download to proceed.
  const everOpened = wasEverOpenedApk()

  const handleDownloadApk = () => {
    downloadApk()
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
              Open the downloaded file from your notifications or Downloads folder, then tap Install. Once it's
              installed, open the app and tap Download again — downloads only work inside the installed app.
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
            >
              Got it
            </button>
          </>
        ) : android ? (
          everOpened ? (
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