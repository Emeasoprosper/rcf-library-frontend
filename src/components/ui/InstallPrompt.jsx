// components/ui/InstallPrompt.jsx
import { useEffect, useState, useRef } from 'react'
import { Share, PlusSquare, X, Smartphone, Zap } from 'lucide-react'

const RENAG_INTERVAL_MS = 5 * 60 * 1000 // re-show every 5 min until installed

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isStandalone()) return undefined

    // Pick up an event that fired BEFORE this component mounted (captured
    // globally in main.jsx) — this is the common case, since
    // beforeinstallprompt usually fires during initial page load, before
    // routing/AppLoader finishes and this component renders.
    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt)
      setVisible(true)
    }

    // Also listen live, in case it fires later than expected on a slow load.
    function handleReady() {
      setDeferredPrompt(window.__deferredInstallPrompt)
      setVisible(true)
    }
    window.addEventListener('installpromptready', handleReady)

    // Covers the user installing via the browser's own address-bar icon
    // (desktop) or its own menu (Android) instead of tapping our button —
    // without this, the 5-min re-nag interval keeps bringing the banner
    // back even though the app is already installed.
    function handleInstalled() {
      clearInterval(intervalRef.current)
      setVisible(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled-app', handleInstalled)

    if (isIos()) {
      setShowIosHint(true)
      setVisible(true)
    }

    intervalRef.current = setInterval(() => {
      if (isStandalone()) {
        clearInterval(intervalRef.current)
        setVisible(false)
        return
      }
      setVisible(true)
    }, RENAG_INTERVAL_MS)

    return () => {
      window.removeEventListener('installpromptready', handleReady)
      window.removeEventListener('appinstalled-app', handleInstalled)
      clearInterval(intervalRef.current)
    }
  }, [])

  if (!visible) return null

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setVisible(false)
      return
    }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setVisible(false)
    if (choice.outcome === 'accepted') clearInterval(intervalRef.current)
    window.__deferredInstallPrompt = null
    setDeferredPrompt(null)
  }

  const handleDismiss = () => setVisible(false) // 5-min interval brings it back on its own

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[60] rounded-2xl bg-[#121212]/90 backdrop-blur-md border border-[#282828] p-4 shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ed760] to-[#00b048] text-black shadow-md shadow-[#1ed760]/20">
          <Zap className="h-5 w-5 fill-black stroke-none" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">Get the App Experience</h4>
            <span className="rounded-full bg-[#1ed760]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1ed760]">
              FAST
            </span>
          </div>

          <p className="mt-1 text-xs text-[#b3b3b3] leading-relaxed">
            {showIosHint ? (
              <>
                Tap <Share className="inline h-3.5 w-3.5 text-white" /> then{' '}
                <span className="font-semibold text-white">Add to Home Screen</span> for instant offline play & zero lag.
              </>
            ) : (
              'Install for instant access, offline reading, and zero lag.'
            )}
          </p>

          {!showIosHint && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 rounded-full bg-[#1ed760] text-black text-xs font-semibold"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 rounded-full text-[#b3b3b3] text-xs font-medium hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-[#b3b3b3] hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#181818] px-3 py-1.5 text-[11px] text-[#b3b3b3]">
        <span className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-[#1ed760]" /> No App Store download needed
        </span>
        {showIosHint && (
          <span className="flex items-center gap-1 text-white font-medium">
            Share <Share className="h-3 w-3" /> → Add <PlusSquare className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  )
}

export default InstallPrompt