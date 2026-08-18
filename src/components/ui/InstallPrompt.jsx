// components/ui/InstallPrompt.jsx
//
// Shown once per page load/reload, before the user does anything else.
// Two completely different popups depending on install state — this file
// does NOT try to guess perfectly whether the app is installed somewhere
// on the device; the only 100%-reliable signal is "am I currently running
// standalone right now" (isRunningAsInstalledApp). For "installed but I'm
// in a normal browser tab right now", the strongest signal available is
// wasEverInstalled() — a flag this same app sets in localStorage the
// moment the installed app is actually opened once in standalone mode.
// That is an honest best-effort signal, not a platform guarantee — no
// browser exposes a universal "is any PWA installed for this origin"
// API to a page running in a normal tab.
import { useEffect, useState } from 'react'
import {
  canPromptInstall,
  triggerInstall,
  isIos,
  isIosSafari,
  isRunningAsInstalledApp,
  wasEverInstalled,
} from '../../lib/pwaInstall'

function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState(null) // 'install' | 'continue'
  const [installing, setInstalling] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)
  // Bumped whenever beforeinstallprompt arrives after this component has
  // already mounted, purely to force a re-render so canPromptInstall()
  // gets re-read (it reads a plain window global, not React state).
  const [, setPromptTick] = useState(0)

  useEffect(() => {
    // Already running as the installed app right now — nothing to show.
    if (isRunningAsInstalledApp()) return

    setMode(wasEverInstalled() ? 'continue' : 'install')
    setVisible(true)

    function handlePromptReady() {
      setPromptTick((t) => t + 1)
    }
    window.addEventListener('installpromptready', handlePromptReady)

    function handleInstalled() {
      setVisible(false)
    }
    window.addEventListener('appinstalled-app', handleInstalled)

    return () => {
      window.removeEventListener('installpromptready', handlePromptReady)
      window.removeEventListener('appinstalled-app', handleInstalled)
    }
  }, [])

  if (!visible || !mode) return null

  const canPrompt = canPromptInstall()
  const ios = isIos()
  const iosButNotSafari = ios && !isIosSafari()

  const handleInstall = async () => {
    if (!canPrompt) return
    setInstalling(true)
    try {
      const outcome = await triggerInstall()
      if (outcome === 'accepted') setJustInstalled(true)
    } finally {
      setInstalling(false)
    }
  }

  const handleContinueToApp = () => {
    // Best-effort only — no browser API can force-launch an installed
    // PWA in standalone mode from a normal tab. This navigates to the
    // app's own start_url; on some Android/Chrome configurations that
    // can trigger an OS "Open in app?" suggestion, but it isn't
    // guaranteed on every device. The dismiss/instruction path below is
    // the fallback that always works: opening the home-screen icon.
    window.location.href = window.location.origin + '/'
  }

  const handleCancel = () => setVisible(false)

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline p-stack-lg">
        {mode === 'continue' ? (
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
        ) : justInstalled ? (
          <>
            <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">check_circle</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">App installed</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Open it from your home screen to start downloading materials for offline reading.
            </p>
            <button
              onClick={handleCancel}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
            >
              Got it
            </button>
          </>
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
                <span className="font-semibold text-on-surface">Android:</span> Tap the ⋮ menu, then "Install app" or "Add to Home screen".
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Desktop:</span> Look for an install icon in the address bar, or check the browser menu for "Install app".
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {canPrompt && (
                <button
                  onClick={handleInstall}
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