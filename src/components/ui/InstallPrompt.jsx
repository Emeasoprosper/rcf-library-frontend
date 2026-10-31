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
  iosBrowser,
  isInAppBrowser,
  copySiteLink,
  isRunningAsInstalledApp,
} from '../../lib/pwaInstall'

// Where "Add to Home Screen" lives in each iPhone browser (iOS 16.4+ for non-Safari).
const IOS_STEPS = {
  safari: ['Tap the Share button (square with an arrow ↑) at the bottom of the screen.', 'Scroll down and tap "Add to Home Screen".', 'Tap "Add". The app appears on your home screen.'],
  chrome: ['Tap the Share button (square with an arrow ↑) at the top right, next to the address bar.', 'Tap "Add to Home Screen". (Can\'t see it? Tap "More" or scroll the list.)', 'Tap "Add". The app appears on your home screen.'],
  edge: ['Tap the ⋯ menu at the bottom, then "Share".', 'Tap "Add to Home Screen".', 'Tap "Add". The app appears on your home screen.'],
  firefox: ['Tap the ☰ menu at the bottom right, then "Share".', 'Tap "Add to Home Screen".', 'Tap "Add". The app appears on your home screen.'],
  other: ['Open this site in Safari or Chrome.', 'Tap the Share button (square with an arrow ↑).', 'Tap "Add to Home Screen", then "Add".'],
}

function Steps({ steps }) {
  return (
    <ol className="mb-stack-md rounded-xl bg-sky-500/10 border border-sky-400/20 p-3 flex flex-col gap-2 text-left">
      {steps.map((s, i) => (
        <li key={s} className="flex gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="flex-none w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  )
}

// Inside WhatsApp/Instagram/Facebook etc. nothing can be installed: get the
// student into a real browser. On Android we can jump straight to Chrome.
function OpenInBrowser({ android, onCancel }) {
  const [copied, setCopied] = useState(false)
  const openChrome = () => {
    const { host, pathname } = window.location
    window.location.href = `intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;end`
  }
  return (
    <>
      <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">open_in_browser</span>
      <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Open in your browser to install</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
        You opened this link inside another app (like WhatsApp or Instagram), which can't install apps.
      </p>
      <Steps
        steps={[
          'Tap the ⋯ or ⋮ menu at the top of this screen.',
          android ? 'Tap "Open in Chrome" (or "Open in browser").' : 'Tap "Open in Safari" (or "Open in browser").',
          'Install the app from there.',
        ]}
      />
      <div className="flex flex-col gap-2">
        {android && (
          <button onClick={openChrome} className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg">
            Open in Chrome
          </button>
        )}
        <button
          onClick={async () => setCopied(await copySiteLink())}
          className={`w-full h-12 rounded-full font-label-lg text-label-lg ${android ? 'bg-sky-500/15 text-sky-200 border border-sky-400/30' : 'bg-primary text-on-primary'}`}
        >
          {copied ? 'Link copied. Paste it in your browser' : 'Copy link'}
        </button>
        <button
          onClick={onCancel}
          className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors"
        >
          Not now
        </button>
      </div>
    </>
  )
}

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
  const inApp = isInAppBrowser()
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
      <div
        className="w-full max-w-sm rounded-2xl border border-outline p-stack-lg overflow-hidden relative"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.25), transparent 60%), radial-gradient(circle at 100% 100%, rgba(249,115,22,0.18), transparent 55%), radial-gradient(circle at 0% 60%, rgba(59,130,246,0.28), transparent 55%), var(--color-surface-container)' }}
      >
        {inApp && (android || ios) ? (
          <OpenInBrowser android={android} onCancel={handleCancel} />
        ) : apkDownloaded ? (
          <>
            <img src="/installApp.png" alt="" className="w-36 h-36 mx-auto object-contain mb-stack-md" />
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
                  className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors"
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
                  className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors"
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
                {canPrompt && (
                  <button
                    onClick={handleInstallPwa}
                    disabled={installing}
                    className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors disabled:opacity-60"
                  >
                    {installing ? 'Installing…' : 'Or add it from Chrome (no download)'}
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )
        ) : (
          <>
            <img src="/installApp.png" alt="" className="w-36 h-36 mx-auto object-contain mb-stack-md" />
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Install App</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Install the app to access downloaded materials, get notifications and use the app offline.
            </p>

            {ios ? (
              <>
                <Steps steps={IOS_STEPS[iosBrowser()] || IOS_STEPS.other} />
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-md">
                  Works in Safari, Chrome, Edge and Firefox on iOS 16.4 or newer. On older iPhones, use Safari.
                </p>
              </>
            ) : (
              <div className="mb-stack-md rounded-xl bg-sky-500/10 border border-sky-400/20 p-3 flex flex-col gap-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Desktop:</span> Look for an install icon in the address bar, or check the browser menu for "Install app".
                </p>
              </div>
            )}

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
                className="w-full h-12 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/30 hover:bg-sky-500/25 font-label-lg text-label-lg transition-colors"
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