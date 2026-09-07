// Persistent bottom-of-sidebar install card. Unlike InstallPrompt.jsx
// (a one-time full-screen modal), this stays visible and reflects the
// real install state at all times — uses the same lib/pwaInstall.js
// checks, no separate/fake logic.
import { useEffect, useState } from 'react'
import {
  isRunningAsInstalledApp,
  isAndroid,
  isIos,
  canPromptInstall,
  triggerInstall,
  downloadApk,
  tryOpenInstalledAndroidApp,
  getApkInstallStatus,
} from '../../lib/pwaInstall'

function InstallSidebarCard() {
  const [installed, setInstalled] = useState(isRunningAsInstalledApp())
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const android = isAndroid()
  const ios = isIos()

  useEffect(() => {
    if (installed || !android) return
    let cancelled = false
    getApkInstallStatus().then((s) => { if (!cancelled) setStatus(s) })
    return () => { cancelled = true }
  }, [installed, android])

  if (installed) {
    return (
      <div className="mx-3 mb-3 mt-auto rounded-xl border border-outline bg-surface-container-high px-3 py-2.5 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">App installed</span>
      </div>
    )
  }

  const label = android
    ? status === 'update' ? 'Update available' : status === 'current' || status === 'unknown' ? 'Open app' : 'Install app'
    : 'Install app'

  async function handleClick() {
    setBusy(true)
    try {
      if (android) {
        if (status === 'current' || status === 'unknown') {
          tryOpenInstalledAndroidApp()
        } else {
          await downloadApk()
          setStatus('current')
        }
      } else if (canPromptInstall()) {
        await triggerInstall()
      } else if (ios) {
        alert('On iPhone/iPad: tap the Share icon in Safari, then "Add to Home Screen".')
      } else {
        alert('Look for an install icon in your browser\u2019s address bar, or check the browser menu for "Install app".')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="mx-3 mb-3 mt-auto rounded-xl border border-outline bg-surface-container-high hover:bg-surface-container px-3 py-2.5 flex items-center gap-2.5 text-left transition-colors disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-primary text-[20px]">
        {android && (status === 'current' || status === 'unknown') ? 'open_in_new' : 'install_mobile'}
      </span>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm font-semibold text-on-surface truncate">{label}</p>
        <p className="font-label-sm text-[11px] text-on-surface-variant">Use RCF Library offline</p>
      </div>
    </button>
  )
}

export default InstallSidebarCard