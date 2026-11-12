// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminReviews.jsx
// What members think: the overall score (counts up), a 5→1 breakdown whose
// bars grow in, the 30-day trend, open complaints, then a feed of every
// rating with its review, tags and the moment that prompted it. Complaints
// carry a red rule and can be marked resolved.
import { useCallback, useEffect, useRef, useState } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'

const TRIGGERS = {
  first_download: 'after their first download',
  first_upload: 'after their first upload',
  first_save: 'after saving their first book',
  second_day: 'on their second day',
  regular: 'while using the app',
  settings: 'from Settings',
  settings_complaint: 'reported from Settings',
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Counts up from 0 to `value` once.
function useCountUp(value, ms = 900) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms)
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}

// Five stars filled to `value` (e.g. 4.3 = four and a third).
function StarMeter({ value, size = 20 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-outline">
              <path d="M12 2.6l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.4 1.3-6.7-5-4.7 6.8-.8z" fill="currentColor" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" width={size} height={size}>
                <path d="M12 2.6l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.4 1.3-6.7-5-4.7 6.8-.8z" fill="#f59e0b" />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}

function Avatar({ user }) {
  const initial = String(user?.name || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="w-10 h-10 flex-none rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        <span className="font-body-md font-bold text-on-surface-variant">{initial}</span>
      )}
    </div>
  )
}

function Summary({ summary, onShowComplaints }) {
  const avg = useCountUp(summary.average || 0)
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 120)
    return () => clearTimeout(t)
  }, [])
  const max = Math.max(1, ...summary.distribution)
  const trend = summary.average_prev_30d ? summary.average_30d - summary.average_prev_30d : null

  return (
    <section className="grid md:grid-cols-[auto_1fr] gap-x-12 gap-y-6 items-center pb-stack-lg border-b border-outline">
      <div>
        <p className="font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Overall rating</p>
        <div className="flex items-end gap-3 mt-1">
          <span className="font-display text-[76px] leading-[0.9] font-extrabold tabular-nums text-on-surface">{avg.toFixed(1)}</span>
          <span className="mb-2 text-on-surface-variant font-body-md">/ 5</span>
        </div>
        <div className="mt-2"><StarMeter value={avg} size={22} /></div>
        <p className="mt-2 font-label-md text-label-md text-on-surface-variant">
          {summary.count} rating{summary.count === 1 ? '' : 's'} · {summary.written} with a written review
        </p>
        {trend != null && Math.abs(trend) >= 0.05 && (
          <p className={`mt-1 font-label-md text-label-md ${trend > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)} vs the 30 days before
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {[5, 4, 3, 2, 1].map((s, i) => {
          const n = summary.distribution[s - 1]
          return (
            <div key={s} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
              <span className="font-label-md text-label-md text-on-surface-variant tabular-nums">{s} ★</span>
              <span className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-[width] duration-700 ease-out ${s >= 4 ? 'bg-amber-400' : s === 3 ? 'bg-amber-300/70' : 'bg-rose-400'}`}
                  style={{ width: grown ? `${(n / max) * 100}%` : '0%', transitionDelay: `${i * 70}ms` }}
                />
              </span>
              <span className="font-label-md text-label-md text-on-surface tabular-nums text-right">{n}</span>
            </div>
          )
        })}
        {summary.open_complaints > 0 && (
          <button onClick={onShowComplaints} className="mt-2 self-start flex items-center gap-2 font-label-md text-label-md text-rose-400 hover:underline">
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-rose-500" />
            </span>
            {summary.open_complaints} open complaint{summary.open_complaints === 1 ? '' : 's'}
          </button>
        )}
      </div>
    </section>
  )
}

function Entry({ item, index, onResolve, busy }) {
  const complaint = item.kind === 'complaint'
  const resolved = Boolean(item.resolvedAt)
  return (
    <article
      className={`rcf-rise relative grid grid-cols-[auto_1fr] gap-4 py-5 border-b border-outline/70 ${complaint ? 'pl-4' : ''}`}
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
    >
      {complaint && <span className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${resolved ? 'bg-emerald-500/60' : 'bg-rose-500'}`} aria-hidden="true" />}
      <Avatar user={item.user} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-body-md text-body-md font-semibold text-on-surface">{item.user?.name || 'A member'}</span>
          <StarMeter value={item.stars} size={14} />
          <span className="font-label-sm text-label-sm text-on-surface-variant">· {timeAgo(item.createdAt)}</span>
          {complaint && (
            <span className={`font-label-sm text-label-sm font-semibold uppercase tracking-wider ${resolved ? 'text-emerald-500' : 'text-rose-400'}`}>
              · {resolved ? 'Resolved' : 'Complaint'}
            </span>
          )}
        </div>
        {item.trigger && TRIGGERS[item.trigger] && (
          <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-0.5">Rated {TRIGGERS[item.trigger]}</p>
        )}
        {item.review ? (
          <p className="mt-2 text-[16px] leading-relaxed text-on-surface whitespace-pre-line break-words">“{item.review}”</p>
        ) : (
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant italic">Rated without a written review.</p>
        )}
        {item.tags.length > 0 && (
          <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
            {item.tags.map((t, i) => (
              <span key={t}>{i > 0 && <span className="mx-1.5 opacity-50">·</span>}{t}</span>
            ))}
          </p>
        )}
        {complaint && (
          <button
            onClick={() => onResolve(item, !resolved)}
            disabled={busy}
            className={`mt-3 h-8 px-3.5 rounded-full font-label-sm text-label-sm font-semibold border transition-colors disabled:opacity-50 ${
              resolved ? 'border-outline text-on-surface-variant hover:text-on-surface' : 'border-rose-500/60 text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            {busy ? 'Saving…' : resolved ? 'Reopen' : 'Mark resolved'}
          </button>
        )}
      </div>
    </article>
  )
}

const KINDS = [
  ['', 'All'],
  ['review', 'Reviews'],
  ['complaint', 'Complaints'],
]

function AdminReviews() {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [kind, setKind] = useState('')
  const [stars, setStars] = useState('')
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const listRef = useRef(null)

  const load = useCallback(async (before) => {
    try {
      const res = await adminApi.reviews({ kind, stars, before })
      setSummary(res.summary)
      setItems((prev) => (before ? [...prev, ...res.items] : res.items))
      setMore(res.items.length === 50)
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [kind, stars])

  useEffect(() => { load() }, [load])

  const resolve = async (item, resolved) => {
    setBusyId(item.id)
    try {
      const { resolvedAt } = await adminApi.resolveReview(item.id, resolved)
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, resolvedAt } : x)))
      setSummary((s) => s && { ...s, open_complaints: Math.max(0, s.open_complaints + (resolved ? -1 : 1)) })
    } catch (err) {
      setError(err.message || 'Could not update that complaint.')
    } finally {
      setBusyId(null)
    }
  }

  const showComplaints = () => {
    setKind('complaint')
    setStars('')
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Reviews" showBack />

      <main className="pb-32 pt-[76px] md:pt-24 md:max-w-4xl md:mx-auto px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && !summary && <LibraryLoader size={120} fullScreen />}

        {summary && <Summary summary={summary} onShowComplaints={showComplaints} />}

        {summary && (
          <>
            <div ref={listRef} className="sticky top-[60px] md:top-[72px] z-10 -mx-margin-mobile px-margin-mobile pt-4 pb-2 bg-background/90 backdrop-blur flex flex-wrap items-end justify-between gap-3 border-b border-outline/70">
              <div className="flex gap-5">
                {KINDS.map(([value, label]) => (
                  <button
                    key={label}
                    onClick={() => setKind(value)}
                    className={`relative pb-2 font-label-md text-label-md transition-colors ${kind === value ? 'text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {label}
                    <span className={`absolute left-0 right-0 -bottom-[9px] h-[2px] rounded-full bg-on-surface transition-transform duration-300 origin-left ${kind === value ? 'scale-x-100' : 'scale-x-0'}`} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 pb-1.5">
                {['', 5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s || 'any'}
                    onClick={() => setStars(String(s))}
                    className={`h-7 min-w-7 px-2 rounded-full font-label-sm text-label-sm tabular-nums transition-colors ${
                      String(stars) === String(s) ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {s ? `${s}★` : 'Any'}
                  </button>
                ))}
              </div>
            </div>

            <div key={`${kind}-${stars}`}>
              {items.map((item, i) => (
                <Entry key={item.id} item={item} index={i} onResolve={resolve} busy={busyId === item.id} />
              ))}
              {items.length === 0 && (
                <p className="py-12 text-center font-body-md text-body-md text-on-surface-variant">
                  {kind === 'complaint' ? 'No complaints. 🎉' : 'Nothing here yet.'}
                </p>
              )}
            </div>

            {more && (
              <button
                onClick={() => load(items[items.length - 1]?.createdAt)}
                className="mt-6 mx-auto block h-10 px-5 rounded-full border border-outline font-label-md text-label-md text-on-surface hover:bg-surface-container-high"
              >
                Load older
              </button>
            )}
          </>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminReviews
