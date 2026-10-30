// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/LeaveSiteDialog.jsx
// "You're about to leave RCF Library" — shown before any news article opens
// on its own website. Triggered with confirmExternal() from lib/externalLink.js.
import { useEffect, useState } from 'react'
import { LEAVE_EVENT } from '../../lib/externalLink'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function LeaveSiteDialog() {
  const [target, setTarget] = useState(null)
  const [iconFailed, setIconFailed] = useState(false)

  useEffect(() => {
    const onLeave = (e) => {
      setIconFailed(false)
      setTarget(e.detail)
    }
    window.addEventListener(LEAVE_EVENT, onLeave)
    return () => window.removeEventListener(LEAVE_EVENT, onLeave)
  }, [])

  useEffect(() => {
    if (!target) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setTarget(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [target])

  if (!target) return null

  const host = hostOf(target.url)
  const siteName = target.sourceName || host
  const go = () => {
    window.open(target.url, '_blank', 'noopener,noreferrer')
    setTarget(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leaving RCF Library"
      className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-6"
      onClick={() => setTarget(null)}
    >
      <div
        className="rcf-pop w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-surface-container border border-outline shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 flex-none rounded-2xl bg-white border border-outline flex items-center justify-center overflow-hidden">
            {host && !iconFailed ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
                alt=""
                className="w-8 h-8"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <span className="material-symbols-outlined text-[28px] text-slate-600">public</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{siteName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{host}</p>
          </div>
        </div>

        <h2 className="font-display text-[24px] font-extrabold leading-tight text-on-surface mt-5">You're about to leave RCF Library</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          This news story is on <b className="text-on-surface">{siteName}</b>. It will open in a new tab, and RCF Library stays open here for when you come back.
        </p>
        {target.title && (
          <p className="mt-3 px-3 py-2 rounded-xl bg-surface-container-low border border-outline font-label-md text-label-md text-on-surface line-clamp-2">
            {target.title}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setTarget(null)}
            className="rcf-press flex-1 py-3.5 rounded-2xl border border-outline text-on-surface font-label-md text-label-md"
          >
            Stay here
          </button>
          <button
            type="button"
            onClick={go}
            className="rcf-press flex-1 py-3.5 rounded-2xl bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5"
          >
            Continue
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LeaveSiteDialog
