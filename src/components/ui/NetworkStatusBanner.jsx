import { useState, useEffect, useRef } from 'react'
import { useConnectionQuality } from '../../hooks/useNetworkStatus'
import { useStorageStatus } from '../../hooks/useStorageStatus'

const ICONS = {
  offline: 'wifi_off',
  slow: 'network_check',
  storage: 'sd_card_alert',
}

function NetworkStatusBanner() {
  const quality = useConnectionQuality()
  const storage = useStorageStatus()
  const [dismissedKey, setDismissedKey] = useState(null)
  const toastRef = useRef(null)

  let current = null
  if (quality === 'offline') {
    current = { key: 'offline', icon: ICONS.offline, text: 'No internet — showing downloaded resources.', tone: 'border-red-500/40' }
  } else if (storage.state === 'low') {
    current = { key: 'storage', icon: ICONS.storage, text: 'Storage is low — downloads may fail to save.', tone: 'border-amber-500/40' }
  } else if (quality === 'slow') {
    current = { key: 'slow', icon: ICONS.slow, text: 'Slow connection — content may load slowly.', tone: 'border-amber-500/40' }
  }

  // Reset dismissal whenever the underlying condition actually changes
  // (e.g. goes offline -> back online -> offline again should show again).
  useEffect(() => {
    if (!current) setDismissedKey(null)
  }, [current?.key])

  // Stays on screen, above every popup, until the person closes it (or the
  // connection problem goes away). Tapping elsewhere no longer hides it.
  if (!current || dismissedKey === current.key) return null

  return (
    <div
      ref={toastRef}
      role="status"
      aria-live="polite"
      data-priority-popup
      className={`fixed top-1/2 -translate-y-1/2 right-0 z-[400] w-60 bg-surface-container border ${current.tone} rounded-l-xl shadow-2xl px-3 py-2.5 flex items-start gap-2`}
      style={{ animation: 'networkToastSlideIn 220ms ease-out' }}
    >
      <style>{`
        @keyframes networkToastSlideIn {
          from { transform: translate(100%, -50%); opacity: 0; }
          to { transform: translate(0, -50%); opacity: 1; }
        }
      `}</style>
      <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-none mt-0.5">{current.icon}</span>
      <p className="font-label-sm text-label-sm text-on-surface-variant flex-1">{current.text}</p>
      <button
        onClick={() => setDismissedKey(current.key)}
        aria-label="Dismiss"
        className="flex-none w-7 h-7 -mr-1 -mt-1 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  )
}

export default NetworkStatusBanner