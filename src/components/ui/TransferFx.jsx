// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/TransferFx.jsx
// Everything that animates while data moves. The default export is mounted
// once in App and listens to lib/transferFx.js:
//   - a floating ring that spins round its outline and fills to 100% for
//     every offline download, with a reminder that it's being kept in the
//     app for offline reading,
//   - a "taking longer than expected, please don't leave" popup when any
//     download, upload or send runs past SLOW_MS,
//   - a browser "leave site?" check while a download/upload is running,
//   - a "Saved for later" toast with a bookmark dropping in.
// Named exports are building blocks pages use directly: ProgressRing,
// BookmarkBurst, WobblyProgress (uploads) and RocketSuccess (upload done).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BOOKMARK_EVENT, SLOW_MS, TRANSFER_EVENT, listTransfers } from '../../lib/transferFx'

// ---------- Progress ring ----------
// pct null = size unknown yet: a spinning arc instead of a fill.
export function ProgressRing({ pct = null, size = 56, stroke = 4, showLabel = true, className = '' }) {
  const r = (size - stroke) / 2 - 2
  const c = 2 * Math.PI * r
  const known = typeof pct === 'number'
  const value = known ? Math.max(0, Math.min(100, pct)) : 0
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-orange-500/15" />
        {known ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#rcfRingGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset 0.25s ease-out' }}
          />
        ) : (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#rcfRingGrad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * 0.28} ${c}`} className="rcf-ring-spin" style={{ transformOrigin: 'center' }} />
        )}
        <defs>
          <linearGradient id="rcfRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      {/* dashed outline turning round the outside the whole time */}
      <span className="rcf-ring-spin absolute inset-0 rounded-full border-2 border-dashed border-orange-400/40" aria-hidden="true" />
      {showLabel && (
        <span className="relative font-label-sm text-[11px] font-bold text-orange-500 tabular-nums">
          {known ? `${Math.round(value)}%` : <span className="material-symbols-outlined text-[18px]">download</span>}
        </span>
      )}
    </span>
  )
}

// ---------- Bookmark burst (sits inside a relative button) ----------
export function BookmarkBurst() {
  const bits = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return { bx: `${Math.cos(a) * 26}px`, by: `${Math.sin(a) * 26}px`, color: i % 2 ? '#fb923c' : '#facc15' }
      }),
    []
  )
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span className="rcf-ring-burst absolute inset-0 rounded-full border-2 border-orange-400" />
      {bits.map((b, i) => (
        <span
          key={i}
          className="rcf-burst-bit absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full"
          style={{ background: b.color, '--bx': b.bx, '--by': b.by }}
        />
      ))}
    </span>
  )
}

// ---------- Wobbly upload bar with a document riding along ----------
export function WobblyProgress({ pct = 0, label = 'Uploading…' }) {
  const value = Math.max(0, Math.min(100, pct))
  return (
    <div className="w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label={label}>
      <div className="relative h-12">
        {/* the document bobbing and tilting on the leading edge */}
        <div className="absolute bottom-0 transition-[left] duration-300 ease-out" style={{ left: `calc(${value}% - 16px)` }}>
          <div className="rcf-doc-bob w-8 h-10 rounded-md bg-white shadow-lg border border-orange-200 flex flex-col gap-[3px] p-1.5 relative">
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-200 rounded-bl-md" />
            <span className="block h-[3px] w-3/4 rounded bg-orange-400" />
            <span className="block h-[3px] w-full rounded bg-slate-300" />
            <span className="block h-[3px] w-5/6 rounded bg-slate-300" />
            <span className="block h-[3px] w-2/3 rounded bg-slate-300" />
          </div>
        </div>
      </div>
      <div className="relative h-5 mt-1 rounded-full bg-surface-container-highest overflow-hidden">
        <div className="rcf-jelly absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 transition-[width] duration-300 ease-out" style={{ width: `${Math.max(value, 4)}%` }}>
          {/* wavy, wobbling leading edge */}
          <svg className="rcf-wave-edge absolute top-0 -right-[9px] h-[300%] w-[10px] text-orange-400" viewBox="0 0 10 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 Q10 5 0 10 Q10 15 0 20 Q10 25 0 30 Q10 35 0 40 Q10 45 0 50 Q10 55 0 60 Z" fill="currentColor" />
          </svg>
          {/* bubbles drifting through the fill */}
          {[0, 1, 2].map((i) => (
            <span key={i} className="rcf-bubble absolute bottom-0 w-1.5 h-1.5 rounded-full bg-white/60" style={{ left: `${20 + i * 28}%`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <p className="font-label-md text-label-md text-on-surface">{label}</p>
        <p className="font-label-md text-label-md text-on-surface-variant tabular-nums">{Math.round(value)}%</p>
      </div>
    </div>
  )
}

// ---------- Rocket launch: the "it's done" popup after an upload ----------
function Rocket() {
  return (
    <svg width="56" height="104" viewBox="0 0 56 104" aria-hidden="true">
      <g className="rcf-flame-a">
        <path d="M18 72 Q28 104 38 72 Z" fill="#f97316" />
      </g>
      <g className="rcf-flame-b">
        <path d="M22 72 Q28 94 34 72 Z" fill="#facc15" />
      </g>
      <path d="M28 2 C44 16 46 44 40 72 L16 72 C10 44 12 16 28 2 Z" fill="#f8fafc" />
      <path d="M28 2 C36 9 40 18 42 28 L14 28 C16 18 20 9 28 2 Z" fill="#ef4444" />
      <circle cx="28" cy="42" r="7" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M16 56 L4 72 L16 70 Z" fill="#ef4444" />
      <path d="M40 56 L52 72 L40 70 Z" fill="#ef4444" />
      <rect x="25" y="58" width="6" height="14" rx="2" fill="#cbd5e1" />
    </svg>
  )
}

export function RocketSuccess({ title, body, actionLabel, onAction }) {
  const [stars] = useState(() =>
    Array.from({ length: 22 }, () => ({ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, delay: `${Math.random() * 2}s`, size: Math.random() > 0.7 ? 3 : 2 }))
  )
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rcf-pop w-full max-w-sm rounded-[28px] bg-surface-container border border-outline shadow-2xl overflow-hidden">
        <div className="relative h-52 overflow-hidden bg-gradient-to-b from-[#050a24] via-[#121a4a] to-[#2b2f77]">
          {stars.map((s, i) => (
            <span key={i} className="rcf-twinkle absolute rounded-full bg-white" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} />
          ))}
          <span className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-amber-100/90 shadow-[0_0_40px_rgba(253,230,138,0.6)]" />
          {/* rocket travels from below the panel up and out of the top */}
          <div className="rcf-rocket-up absolute left-1/2 bottom-0 -ml-7">
            <Rocket />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="rcf-smoke absolute left-1/2 top-[96px] w-5 h-5 -ml-2.5 rounded-full bg-white/50" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#2b2f77] to-transparent" />
        </div>
        <div className="p-6 text-center">
          <h2 className="font-display text-[22px] font-extrabold text-on-surface">{title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{body}</p>
          <button onClick={onAction} className="rcf-press mt-5 w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-semibold">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Global watcher ----------
const SLOW_TEXT = {
  download: ['Taking longer than expected', "Your download is still coming in. Please don't leave or close the app until it reaches 100%."],
  upload: ['Taking longer than expected', "Your upload is still sending. Please don't leave or close the app until it finishes."],
  request: ['Taking longer than expected', "We're still sending this. Please don't leave the page; it'll finish shortly."],
}

function DownloadPill({ t }) {
  return (
    <div className="rcf-pop pointer-events-auto flex items-center gap-3 rounded-2xl bg-surface-container border border-outline shadow-2xl pl-2 pr-4 py-2 max-w-[92vw]">
      <ProgressRing pct={t.progress} size={48} stroke={4} />
      <div className="min-w-0">
        <p className="font-label-md text-label-md font-semibold text-on-surface truncate max-w-[220px]">
          {t.progress === 100 ? 'Download complete' : 'Downloading'}{t.title ? ` · ${t.title}` : ''}
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Saving inside the app so you can read it offline, with no data.
        </p>
      </div>
    </div>
  )
}

function BookmarkToast({ title, saved = true, onDone }) {
  const navigate = useNavigate()
  const doneRef = useRef(onDone)
  useEffect(() => { doneRef.current = onDone }, [onDone])
  useEffect(() => {
    const timer = setTimeout(() => doneRef.current(), 3200)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[112px] md:bottom-16 z-[310]" aria-live="polite">
      <div className="rcf-pop flex items-center gap-3 rounded-full bg-surface-container border border-outline shadow-2xl pl-3 pr-1.5 py-1.5">
        {saved ? (
          <span className="rcf-bookmark-drop material-symbols-outlined text-orange-500 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
        ) : (
          <span className="relative w-6 h-6 flex-none">
            <span className="absolute inset-0 material-symbols-outlined text-on-surface-variant text-[24px]">bookmark_border</span>
            <span className="rcf-bookmark-lift absolute inset-0 material-symbols-outlined text-orange-500 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
          </span>
        )}
        <span className={`font-label-md text-label-md font-semibold text-on-surface max-w-[180px] truncate ${saved ? '' : 'pr-3'}`}>
          {saved ? 'Saved for later' : 'Removed from saved'}{title ? ` · ${title}` : ''}
        </span>
        {saved && (
          <button onClick={() => { onDone(); navigate('/saved') }} className="rcf-press h-8 px-3 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold">
            View
          </button>
        )}
      </div>
    </div>
  )
}

function TransferFx() {
  const [transfers, setTransfers] = useState(() => listTransfers())
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => new Set())
  const [bookmark, setBookmark] = useState(null)

  useEffect(() => {
    const onChange = (e) => setTransfers(e.detail)
    const onBookmark = (e) => setBookmark({ title: e.detail.title, saved: e.detail.saved !== false, key: Date.now() })
    window.addEventListener(TRANSFER_EVENT, onChange)
    window.addEventListener(BOOKMARK_EVENT, onBookmark)
    return () => {
      window.removeEventListener(TRANSFER_EVENT, onChange)
      window.removeEventListener(BOOKMARK_EVENT, onBookmark)
    }
  }, [])

  // Tick only while something is running, to notice when it turns slow.
  const running = transfers.length > 0
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Leaving mid-download/upload loses it: ask the browser to confirm.
  const heavy = transfers.some((t) => t.kind !== 'request')
  useEffect(() => {
    if (!heavy) return undefined
    const onLeave = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [heavy])

  const slow = transfers.find((t) => now - t.startedAt > SLOW_MS && t.progress !== 100 && !dismissed.has(t.id))
  const downloads = transfers.filter((t) => t.kind === 'download')
  const [slowTitle, slowBody] = slow ? SLOW_TEXT[slow.kind] || SLOW_TEXT.request : []

  return (
    <>
      {downloads.length > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[112px] md:bottom-16 z-[305] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
          {downloads.map((t) => <DownloadPill key={t.id} t={t} />)}
        </div>
      )}

      {slow && (
        <div role="alertdialog" aria-modal="true" aria-label={slowTitle} className="fixed inset-0 z-[330] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="rcf-pop w-full max-w-sm rounded-[28px] bg-surface-container border border-outline shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="mb-4">
              {slow.kind === 'request' ? (
                <span className="rcf-hourglass material-symbols-outlined text-orange-500 text-[56px]">hourglass_top</span>
              ) : (
                <ProgressRing pct={slow.progress} size={84} stroke={6} />
              )}
            </div>
            <h3 className="font-display text-[20px] font-extrabold text-on-surface">{slowTitle}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">{slowBody}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">A slow network can do this. It's still working.</p>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(slow.id))}
              className="rcf-press mt-5 w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-semibold"
            >
              Okay, I'll wait
            </button>
          </div>
        </div>
      )}

      {bookmark && <BookmarkToast key={bookmark.key} title={bookmark.title} saved={bookmark.saved} onDone={() => setBookmark(null)} />}
    </>
  )
}

export default TransferFx
