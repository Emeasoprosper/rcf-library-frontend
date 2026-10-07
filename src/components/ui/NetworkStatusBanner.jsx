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

  // Clicking anywhere on the main screen outside the toast dismisses it.
  useEffect(() => {
    if (!current || dismissedKey === current.key) return
    function handleClickOutside(e) {
      if (toastRef.current && !toastRef.current.contains(e.target)) {
        setDismissedKey(current.key)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [current?.key, dismissedKey])

  if (!current || dismissedKey === current.key) return null

  return (
    <div
      ref={toastRef}
      className={`fixed top-1/2 -translate-y-1/2 right-0 z-[250] w-56 bg-surface-container border ${current.tone} rounded-l-xl shadow-2xl px-3 py-2.5 flex items-start gap-2`}
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
        className="flex-none text-on-surface-variant hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  )
}

export default NetworkStatusBanner