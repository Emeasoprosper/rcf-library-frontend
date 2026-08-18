// components/ui/DownloadGateModal.jsx
import { useState } from 'react'
import {
  canPromptInstall,
  triggerInstall,
  isIos,
  isIosSafari,
  wasEverInstalled,
} from '../../lib/pwaInstall'

// Blocking popup shown the moment a Download action is attempted outside
// the installed PWA. Nothing is fetched before or during this modal — the
// caller (ResourceDetail / ResourceReader) must not start any network
// request until this resolves.
//
// Three distinct states, because "not currently running as the installed
// app" covers different situations:
//   1. This device has never installed the app  → show install path.
//   2. This device HAS installed it before, but the person is just
//      browsing the normal website right now     → tell them to open the
//      app they already have, don't ask them to install it again.
//   3. Detection can't fully tell (unknown browser, blocked APIs, etc.)
//      → ALWAYS show full manual instructions covering every platform,
//      never leave the popup with no path forward.
function DownloadGateModal({ open, onClose }) {
  const [installing, setInstalling] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  if (!open) return null

  const canPrompt = canPromptInstall()
  const ios = isIos()
  const iosButNotSafari = ios && !isIosSafari()
  const alreadyInstalled = wasEverInstalled()

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

  const handleClose = () => {
    setJustInstalled(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline p-stack-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {justInstalled ? (
          <>
            <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">check_circle</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">App installed</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              Open the app from your home screen, then tap Download again — downloads only work inside the installed app.
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
            >
              Got it
            </button>
          </>
        ) : alreadyInstalled ? (
          <>
            <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">check_circle</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Continue in the App</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              You've already installed RCF Library. Downloads only work inside the installed app — find its icon on
              your home screen and open it from there.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Best-effort only — there is no browser API that can
                  // force-launch an already-installed PWA in standalone
                  // mode from inside a normal tab. This just reloads at
                  // the app's start_url; on some Android/Chrome versions
                  // that triggers an OS "Open in app?" suggestion, but it
                  // is not guaranteed. The instruction above is the real
                  // fallback that always works.
                  window.location.href = window.location.origin + '/'
                }}
                className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
              >
                Continue in App
              </button>
              <button
                onClick={handleClose}
                className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
              >
                Got it
              </button>
            </div>
          </>
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

            {/* Always show every platform's manual path — never leave
                this popup with no instructions, regardless of whether
                device detection guessed right. */}
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
                  {installing ? 'Installing…' : 'Download App'}
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