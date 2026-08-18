// components/ui/DownloadGateModal.jsx
import { useState } from 'react'
import { canPromptInstall, triggerInstall, isIos } from '../../lib/pwaInstall'

// Blocking popup shown the moment a Download action is attempted outside
// the installed PWA. Nothing is fetched before or during this modal — the
// caller (ResourceDetail / ResourceReader) must not start any network
// request until this resolves.
function DownloadGateModal({ open, onClose }) {
  const [installing, setInstalling] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  if (!open) return null

  const canPrompt = canPromptInstall()
  const ios = isIos()

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
        ) : (
          <>
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">download_for_offline</span>
            <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">Download Unavailable</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              You need to install and open the app before you can download materials for offline reading.
            </p>

            {ios && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-md">
                Tap the Share icon, then "Add to Home Screen".
              </p>
            )}

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