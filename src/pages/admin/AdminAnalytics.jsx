// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminAnalytics.jsx
import { useState, useEffect, useRef } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminAnalyticsApi, adminApi } from '../../services/api'

const TZ = 'Africa/Lagos'
const COLORS = { orange: '#f97316', blue: '#3b82f6', green: '#22c55e', violet: '#8b5cf6', rose: '#f43f5e' }
const TABS = ['Checkup', 'Overview', 'Resources', 'Health']
const EVENT_LABELS = {
  api_error: 'API errors',
  upload_failed: 'Failed uploads',
  ai_failure: 'AI failures',
  preview_failed: 'Preview failures',
}

const todayLagos = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })
function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const fmt = (n) => (n == null ? '–' : Number(n).toLocaleString())
const fmtDate = (s) =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : s

function downloadCsv(filename, rows) {
  if (!rows?.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}` // stops spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function useApi(fetcher, deps, enabled = true) {
  const [state, setState] = useState({ data: null, error: '', loading: enabled })
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: '' }))
    fetcher()
      .then((data) => { if (!cancelled) setState({ data, error: '', loading: false }) })
      .catch((err) => { if (!cancelled) setState({ data: null, error: err.message || 'Could not load data.', loading: false }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled])
  return state
}

function Empty({ text = 'No data for this period yet.' }) {
  return <p className="font-label-sm text-label-sm text-on-surface-variant py-4 text-center">{text}</p>
}

function Section({ title, action, children }) {
  return (
    <section className="mb-stack-lg">
      <div className="flex items-center justify-between gap-3 mb-stack-sm">
        <h2 className="font-headline-sm text-headline-sm font-display text-on-surface">{title}</h2>
        {action}
      </div>
      <div className="p-stack-md rounded-xl bg-surface-container border border-outline">{children}</div>
    </section>
  )
}

function CsvButton({ onClick }) {
  return (
    <button onClick={onClick} className="px-3 h-8 rounded-full border border-outline text-on-surface font-label-sm text-label-sm flex items-center gap-1">
      <span className="material-symbols-outlined text-[16px]">download</span>
      CSV
    </button>
  )
}

function Kpi({ label, value, growth, note, invert = false }) {
  let growthText = null
  let growthClass = 'text-on-surface-variant'
  if (growth !== undefined) {
    if (growth == null) growthText = 'no earlier data to compare'
    else {
      const good = invert ? growth < 0 : growth > 0
      const bad = invert ? growth > 0 : growth < 0
      growthText = `${growth > 0 ? '▲' : growth < 0 ? '▼' : '•'} ${Math.abs(growth)}% vs previous period`
      growthClass = good ? 'text-emerald-500' : bad ? 'text-red-400' : 'text-on-surface-variant'
    }
  }
  return (
    <div className="p-stack-md rounded-xl bg-surface-container border border-outline">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-lg text-headline-lg font-display text-on-surface">{value}</p>
      {growthText && <p className={`font-label-sm text-label-sm ${growthClass}`}>{growthText}</p>}
      {note && <p className="font-label-sm text-label-sm text-on-surface-variant/70">{note}</p>}
    </div>
  )
}

function Legend({ series }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
          <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

function LineChart({ rows, series, xKey = 'date' }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = 200, P = { l: 38, r: 8, t: 10, b: 22 }
  if (!rows?.length) return <Empty />
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => r[s.key] || 0)))
  const innerW = W - P.l - P.r
  const x = (i) => P.l + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW)
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b)
  const pick = (clientX, el) => {
    const rect = el.getBoundingClientRect()
    const rel = ((clientX - rect.left) / rect.width) * W
    const i = Math.round(((rel - P.l) / innerW) * (rows.length - 1))
    setHover(Math.min(Math.max(i, 0), rows.length - 1))
  }
  const h = hover != null ? rows[hover] : null
  return (
    <div>
      <Legend series={series} />
      <p className="font-label-sm text-label-sm text-on-surface-variant h-5">
        {h ? `${fmtDate(h[xKey])}: ${series.map((s) => `${s.label} ${fmt(h[s.key] || 0)}`).join(' · ')}` : 'Touch or hover the chart for exact values'}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ touchAction: 'pan-y' }}
        onMouseMove={(e) => pick(e.clientX, e.currentTarget)}
        onTouchMove={(e) => pick(e.touches[0].clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} stroke="currentColor" opacity="0.12" />
            <text x={P.l - 6} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">{fmt(Math.round(max * t))}</text>
          </g>
        ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r[s.key] || 0)}`).join(' ')}
            fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          />
        ))}
        {h && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="currentColor" opacity="0.3" />}
        {h && series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(h[s.key] || 0)} r="4" fill={s.color} />)}
        <text x={P.l} y={H - 4} fontSize="11" fill="currentColor" opacity="0.6">{fmtDate(rows[0][xKey])}</text>
        <text x={W - P.r} y={H - 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">{fmtDate(rows[rows.length - 1][xKey])}</text>
      </svg>
    </div>
  )
}

function ColumnChart({ rows, yKey, color = COLORS.orange, xKey = 'date' }) {
  const W = 640, H = 180, P = { l: 38, r: 8, t: 10, b: 22 }
  if (!rows?.length) return <Empty />
  const max = Math.max(1, ...rows.map((r) => r[yKey] || 0))
  const slot = (W - P.l - P.r) / rows.length
  const barW = Math.max(2, slot * 0.7)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((t) => {
        const yy = P.t + (1 - t) * (H - P.t - P.b)
        return (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={yy} y2={yy} stroke="currentColor" opacity="0.12" />
            <text x={P.l - 6} y={yy + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">{fmt(Math.round(max * t))}</text>
          </g>
        )
      })}
      {rows.map((r, i) => {
        const v = r[yKey] || 0
        const bh = (v / max) * (H - P.t - P.b)
        return (
          <rect key={r[xKey]} x={P.l + i * slot + (slot - barW) / 2} y={H - P.b - bh} width={barW} height={bh} rx="2" fill={color}>
            <title>{`${fmtDate(r[xKey])}: ${fmt(v)}`}</title>
          </rect>
        )
      })}
      <text x={P.l} y={H - 4} fontSize="11" fill="currentColor" opacity="0.6">{fmtDate(rows[0][xKey])}</text>
      <text x={W - P.r} y={H - 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">{fmtDate(rows[rows.length - 1][xKey])}</text>
    </svg>
  )
}

function HBars({ items, labelKey, valueKey, percentKey, color = COLORS.orange, emptyText }) {
  if (!items?.length) return <Empty text={emptyText} />
  const max = Math.max(1, ...items.map((i) => i[valueKey] || 0))
  return (
    <div className="flex flex-col gap-3">
      {items.map((i) => (
        <div key={`${i[labelKey]}`}>
          <div className="flex justify-between gap-3 font-label-sm text-label-sm text-on-surface">
            <span className="truncate">{i[labelKey]}</span>
            <span className="flex-none text-on-surface-variant">
              {fmt(i[valueKey])}{percentKey && i[percentKey] != null ? ` · ${i[percentKey]}%` : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${((i[valueKey] || 0) / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DualBars({ rows }) {
  if (!rows.length) return <Empty />
  return (
    <div>
      <Legend series={[{ key: 'a', label: '% of library', color: COLORS.orange }, { key: 'b', label: '% of downloads', color: COLORS.blue }]} />
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <p className="font-label-sm text-label-sm text-on-surface truncate">{r.label}</p>
            {[['a', COLORS.orange], ['b', COLORS.blue]].map(([k, c]) => (
              <div key={k} className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r[k]}%`, background: c }} />
                </div>
                <span className="w-12 text-right font-label-sm text-label-sm text-on-surface-variant">{r[k]}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#f43f5e', '#eab308', '#14b8a6', '#94a3b8']

function PieChart({ items, emptyText }) {
  const clean = (items || []).filter((i) => i.value > 0)
  if (clean.length === 0) return <Empty text={emptyText} />
  const sorted = [...clean].sort((a, b) => b.value - a.value)
  const rest = sorted.slice(7).reduce((s, i) => s + i.value, 0)
  const slices = rest > 0 ? [...sorted.slice(0, 7), { label: 'Other', value: rest }] : sorted.slice(0, 7)
  const total = slices.reduce((s, i) => s + i.value, 0)
  const R = 30
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 160 160" className="w-44 h-44 flex-none -rotate-90">
        {slices.map((s, i) => {
          const len = (s.value / total) * C
          const node = (
            <circle
              key={s.label}
              cx="80" cy="80" r={R} fill="none"
              stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth="60"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
            >
              <title>{`${s.label}: ${fmt(s.value)}`}</title>
            </circle>
          )
          offset += len
          return node
        })}
      </svg>
      <div className="flex flex-col gap-2 min-w-0 w-full">
        {slices.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface">
            <span className="w-3 h-3 rounded-full flex-none" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto flex-none text-on-surface-variant">
              {fmt(s.value)} · {Math.round((s.value / total) * 1000) / 10}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeardFromPie() {
  const { data, error, loading } = useApi(() => adminApi.registrationStats(), [])
  return (
    <Section title="How people heard about the app">
      {loading ? (
        <Empty text="Loading…" />
      ) : error ? (
        <Empty text={error} />
      ) : (
        <PieChart
          items={(data.heardFrom || []).map((r) => ({ label: r.heard_from, value: r.count }))}
          emptyText="No answers yet."
        />
      )}
    </Section>
  )
}

function TapKpi({ onTap, ...props }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap() }}
      className="cursor-pointer rounded-xl hover:ring-1 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <Kpi {...props} />
    </div>
  )
}

const HISTORY_TABS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']]
const HISTORY_STEP = { daily: 14, weekly: 12, monthly: 12 }
const HISTORY_MAX = { daily: 60, weekly: 52, monthly: 24 }
const HISTORY_HELP = {
  daily: 'People who opened the app on each day, newest first.',
  weekly: 'People who opened the app at least once in each week (Monday to Sunday).',
  monthly: 'People who opened the app at least once in each month.',
}

function historyLabel(g, it) {
  const asDate = (s) => new Date(`${s}T00:00:00Z`)
  if (g === 'daily') {
    return asDate(it.start).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
  }
  if (g === 'weekly') return `Mon ${fmtDate(it.start)} to Sun ${fmtDate(it.finish)}`
  return asDate(it.start).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function ActivityHistory({ granularity, onGranularity }) {
  const [count, setCount] = useState(HISTORY_STEP[granularity])
  const { data, error, loading } = useApi(() => adminAnalyticsApi.activity({ granularity, count }), [granularity, count])
  const items = data ? [...data.items].reverse() : []
  const max = Math.max(1, ...items.map((i) => i.activeUsers))
  const canShowMore = data && data.items.length >= count && count < HISTORY_MAX[granularity]

  return (
    <Section
      title="Activity history"
      action={
        <CsvButton
          onClick={() => downloadCsv(`activity-${granularity}.csv`, items.map((i) => ({
            period_start: i.start, period_end: i.finish, active_users: i.activeUsers,
            new_registrations: i.registrations, downloads: i.downloads, views: i.views,
          })))}
        />
      }
    >
      <div className="flex gap-2 mb-3">
        {HISTORY_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onGranularity(key)}
            className={`px-4 h-9 rounded-full font-label-sm text-label-sm ${granularity === key ? 'bg-primary text-on-primary' : 'border border-outline text-on-surface'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">{HISTORY_HELP[granularity]}</p>

      {loading && <Empty text="Loading…" />}
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      {!loading && !error && (
        <div className="flex flex-col divide-y divide-outline">
          {items.map((i) => (
            <div key={i.start} className="py-2">
              <div className="flex justify-between gap-3 font-label-sm text-label-sm text-on-surface">
                <span className="truncate">
                  {historyLabel(granularity, i)}
                  {i.inProgress && <span className="ml-2 text-on-surface-variant">(so far)</span>}
                </span>
                <span className="flex-none font-semibold">{fmt(i.activeUsers)} active</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden mt-1">
                <div className="h-full rounded-full" style={{ width: `${(i.activeUsers / max) * 100}%`, background: COLORS.orange }} />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                {fmt(i.registrations)} new · {fmt(i.downloads)} downloads · {fmt(i.views)} views
              </p>
            </div>
          ))}
        </div>
      )}
      {canShowMore && (
        <button
          onClick={() => setCount((c) => Math.min(c + HISTORY_STEP[granularity], HISTORY_MAX[granularity]))}
          className="mt-3 px-4 h-9 rounded-full border border-outline text-on-surface font-label-sm text-label-sm"
        >
          Show more
        </button>
      )}
    </Section>
  )
}

const LEVEL_STYLE = {
  critical: { label: 'Fix soon', dot: 'bg-red-500', box: 'border-red-500/40 bg-red-500/10', bar: '#ef4444' },
  watch: { label: 'Keep an eye on', dot: 'bg-amber-400', box: 'border-amber-400/40 bg-amber-400/10', bar: '#eab308' },
  good: { label: 'Going well', dot: 'bg-emerald-500', box: 'border-emerald-500/40 bg-emerald-500/10', bar: '#22c55e' },
  info: { label: 'Good to know', dot: 'bg-sky-400', box: 'border-outline bg-surface-container', bar: '#38bdf8' },
}
const AREA_LABEL = { growth: 'Growth', engagement: 'Engagement', health: 'Health', capacity: 'Limits' }

function CheckupTab() {
  const [nonce, setNonce] = useState(0)
  const { data, error, loading } = useApi(() => adminAnalyticsApi.insights(), [nonce])
  if (loading) return <div className="flex justify-center py-stack-lg"><LibraryLoader size={80} /></div>
  if (error) return <p className="font-body-md text-body-md text-error">{error}</p>

  const s = LEVEL_STYLE[data.summary.level]
  const groups = ['critical', 'watch', 'good', 'info']
    .map((level) => ({ level, list: data.items.filter((i) => i.level === level) }))
    .filter((g) => g.list.length > 0)

  return (
    <>
      <div className={`mb-stack-lg p-stack-md rounded-xl border ${s.box}`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${s.dot}`} />
          <h2 className="font-headline-sm text-headline-sm font-display text-on-surface">{data.summary.headline}</h2>
        </div>
        <p className="font-body-md text-body-md text-on-surface mt-1">{data.summary.detail}</p>
        {data.summary.praise && <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{data.summary.praise}</p>}
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Checked {new Date(data.generatedAt).toLocaleString()}</span>
          <button onClick={() => setNonce((n) => n + 1)} className="px-3 h-8 rounded-full border border-outline text-on-surface font-label-sm text-label-sm">
            Check again
          </button>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.level} className="mb-stack-lg">
          <h2 className="font-headline-sm text-headline-sm font-display text-on-surface mb-stack-sm">{LEVEL_STYLE[g.level].label}</h2>
          <div className="flex flex-col gap-3">
            {g.list.map((item, i) => (
              <div key={`${item.title}-${i}`} className={`p-stack-md rounded-xl border ${LEVEL_STYLE[g.level].box}`}>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{AREA_LABEL[item.area] || item.area}</p>
                <p className="font-body-md text-body-md font-semibold text-on-surface">{item.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 break-words">{item.detail}</p>
                {typeof item.percent === 'number' && (
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden mt-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(item.percent, 100)}%`, background: LEVEL_STYLE[g.level].bar }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-lg">
        These verdicts use rules of thumb on your real data, not guarantees. Limits assume {data.limits.dbMb} MB of database, {data.limits.memMb} MB of server memory and {data.limits.driveGb} GB of file storage.
      </p>
    </>
  )
}

function DateFilter({ range, onChange }) {
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [msg, setMsg] = useState('')
  useEffect(() => { setFrom(range.from); setTo(range.to) }, [range.from, range.to])

  const apply = () => {
    const days = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000 + 1
    if (!from || !to || Number.isNaN(days) || days < 1) return setMsg('Pick a valid start and end date.')
    if (days > 366) return setMsg('Pick 366 days or fewer.')
    setMsg('')
    onChange({ from, to })
  }
  const preset = (days) => {
    const t = todayLagos()
    onChange({ from: addDays(t, -(days - 1)), to: t })
  }
  const pill = 'px-3 h-9 rounded-full border border-outline text-on-surface font-label-sm text-label-sm'
  const input = 'h-9 px-3 rounded-lg bg-surface-container-low border border-outline text-on-surface font-label-sm text-label-sm'
  return (
    <div className="mb-stack-lg p-stack-md rounded-xl bg-surface-container border border-outline">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => <button key={d} onClick={() => preset(d)} className={pill}>{d} days</button>)}
        <input type="date" value={from} max={todayLagos()} onChange={(e) => setFrom(e.target.value)} className={input} />
        <span className="text-on-surface-variant font-label-sm text-label-sm">to</span>
        <input type="date" value={to} max={todayLagos()} onChange={(e) => setTo(e.target.value)} className={input} />
        <button onClick={apply} className="px-4 h-9 rounded-full bg-primary text-on-primary font-label-sm text-label-sm">Apply</button>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
        Showing {fmtDate(range.from)} to {fmtDate(range.to)}, compared with the same number of days before it. Days are Lagos time.
      </p>
      {msg && <p className="font-label-sm text-label-sm text-error mt-1">{msg}</p>}
    </div>
  )
}

function OverviewTab({ range }) {
  const { data: ov, error, loading } = useApi(() => adminAnalyticsApi.overview({ from: range.from, to: range.to }), [range.from, range.to])
  const [gran, setGran] = useState('daily')
  const historyRef = useRef(null)
  const openHistory = (g) => {
    setGran(g)
    setTimeout(() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  if (loading) return <div className="flex justify-center py-stack-lg"><LibraryLoader size={80} /></div>
  if (error) return <p className="font-body-md text-body-md text-error">{error}</p>
  const k = ov.kpis
  const since = ov.tracking.activitySince
  const note = !since
    ? 'Active-user tracking has no data yet. It starts counting from the first app opens after this update.'
    : since > ov.range.from
    ? `Active-user history starts on ${fmtDate(since)}. Earlier days show zero because they were never recorded.`
    : null
  const comp = [
    ['New registrations', k.newRegistrations], ['Active users', k.activeUsers], ['Returning users', k.returningUsers],
    ['Daily active (end date)', k.dau], ['Weekly active', k.wau], ['Monthly active', k.mau],
    ['Downloads', k.downloads], ['Unique downloaders', k.uniqueDownloaders], ['Views', k.views],
  ]
  return (
    <>
      {note && <p className="mb-stack-md p-stack-sm rounded-lg bg-surface-container border border-outline font-label-sm text-label-sm text-on-surface-variant">{note}</p>}

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
        <Kpi label="Total users" value={fmt(k.totalUsers)} />
        <Kpi label="New registrations" value={fmt(k.newRegistrations.current)} growth={k.newRegistrations.growthPct} />
        <Kpi label="Active users (unique)" value={fmt(k.activeUsers.current)} growth={k.activeUsers.growthPct} />
        <Kpi label="Returning users" value={fmt(k.returningUsers.current)} growth={k.returningUsers.growthPct} note="Active, and signed up before this period" />
        <TapKpi label="Daily active (end date)" value={fmt(k.dau.current)} growth={k.dau.growthPct} note="Tap to see every day" onTap={() => openHistory('daily')} />
        <TapKpi label="Weekly active" value={fmt(k.wau.current)} growth={k.wau.growthPct} note="Tap to see every week" onTap={() => openHistory('weekly')} />
        <TapKpi label="Monthly active" value={fmt(k.mau.current)} growth={k.mau.growthPct} note="Tap to see every month" onTap={() => openHistory('monthly')} />
        <Kpi label="Stickiness" value={k.stickinessPct == null ? '–' : `${k.stickinessPct}%`} note="Daily active ÷ monthly active" />
        <Kpi label="Downloads" value={fmt(k.downloads.current)} growth={k.downloads.growthPct} />
        <Kpi label="Unique downloaders" value={fmt(k.uniqueDownloaders.current)} growth={k.uniqueDownloaders.growthPct} />
        <Kpi label="Resource views" value={fmt(k.views.current)} growth={k.views.growthPct} note="Once per signed-in user per day" />
        <Kpi label="New and active" value={fmt(k.newActiveUsers.current)} growth={k.newActiveUsers.growthPct} />
      </section>

      <Section
        title="Application growth"
        action={<CsvButton onClick={() => downloadCsv(`daily-report-${ov.range.from}-to-${ov.range.to}.csv`, ov.series.map((r) => ({
          date: r.date, total_users: r.totalUsers, new_registrations: r.registrations, active_users: r.activeUsers, downloads: r.downloads, views: r.views,
        })))} />}
      >
        <LineChart rows={ov.series} series={[{ key: 'totalUsers', label: 'Total users', color: COLORS.violet }]} />
      </Section>

      <Section title="Registrations and activity">
        <LineChart rows={ov.series} series={[
          { key: 'activeUsers', label: 'Active users', color: COLORS.orange },
          { key: 'registrations', label: 'New registrations', color: COLORS.green },
        ]} />
      </Section>

      <Section title="Downloads per day"><ColumnChart rows={ov.series} yKey="downloads" color={COLORS.blue} /></Section>

      <div ref={historyRef}>
        <ActivityHistory key={gran} granularity={gran} onGranularity={setGran} />
      </div>

      <HeardFromPie />

      <Section title="Compared with the previous period">
        <div className="flex flex-col divide-y divide-outline">
          <div className="grid grid-cols-4 gap-2 pb-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="col-span-1">Metric</span><span className="text-right">Now</span><span className="text-right">Before</span><span className="text-right">Change</span>
          </div>
          {comp.map(([label, v]) => (
            <div key={label} className="grid grid-cols-4 gap-2 py-2 font-label-sm text-label-sm text-on-surface">
              <span className="truncate">{label}</span>
              <span className="text-right">{fmt(v.current)}</span>
              <span className="text-right text-on-surface-variant">{fmt(v.previous)}</span>
              <span className="text-right">{v.growthPct == null ? '–' : `${v.growthPct > 0 ? '+' : ''}${v.growthPct}%`}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="User retention">
        {ov.retention.every((r) => r.cohort === 0) ? (
          <Empty text="Not enough history yet. Retention needs users who first appeared at least 1, 7 or 30 days ago." />
        ) : (
          <div className="flex flex-col divide-y divide-outline">
            {ov.retention.map((r) => (
              <div key={r.day} className="flex justify-between py-2 font-label-sm text-label-sm text-on-surface">
                <span>Came back on day {r.day}</span>
                <span className="text-on-surface-variant">
                  {r.ratePct == null ? '–' : `${r.ratePct}%`} ({fmt(r.retained)} of {fmt(r.cohort)})
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Most downloaded in this period"
        action={<CsvButton onClick={() => downloadCsv('top-downloaded.csv', ov.topDownloaded.map((r) => ({ title: r.title, type: r.type, downloads: r.downloads })))} />}
      >
        <HBars items={ov.topDownloaded} labelKey="title" valueKey="downloads" color={COLORS.blue} emptyText="No downloads in this period." />
      </Section>

      <Section title="Most viewed in this period">
        <HBars items={ov.topViewed} labelKey="title" valueKey="views" emptyText="No views recorded in this period yet." />
      </Section>

      <Section title="Most viewed of all time">
        <HBars items={ov.mostViewedLifetime} labelKey="title" valueKey="views" color={COLORS.violet} />
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">Older totals counted every page refresh, so they run high.</p>
      </Section>

      <Section title="Category popularity (downloads in this period)">
        <HBars items={ov.categoryDownloads} labelKey="name" valueKey="downloads" color={COLORS.green} emptyText="No downloads in this period." />
      </Section>
    </>
  )
}

function ResourcesTab() {
  const { data: rs, error, loading } = useApi(() => adminAnalyticsApi.resources(), [])
  if (loading) return <div className="flex justify-center py-stack-lg"><LibraryLoader size={80} /></div>
  if (error) return <p className="font-body-md text-body-md text-error">{error}</p>

  const totalDl = rs.downloadsByType.reduce((s, r) => s + r.downloads, 0)
  const dual = rs.byType
    .filter((t) => t.total > 0)
    .map((t) => {
      const dl = rs.downloadsByType.find((d) => d.label === t.label)?.downloads || 0
      return { label: t.label, a: t.percentOfAll, b: totalDl > 0 ? Math.round((dl / totalDl) * 1000) / 10 : 0 }
    })

  return (
    <>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
        <Kpi label="Total resources" value={fmt(rs.totals.all)} />
        <Kpi label="Approved" value={fmt(rs.totals.approved)} />
        <Kpi label="Pending" value={fmt(rs.totals.pending)} />
        <Kpi label="Rejected" value={fmt(rs.totals.rejected)} />
        <Kpi label="Preview failed" value={fmt(rs.preview.failed)} note="No thumbnail could be made" />
        <Kpi label="Preview in progress" value={fmt(rs.preview.inProgress)} />
      </section>

      <Section
        title="Resources by type"
        action={<CsvButton onClick={() => downloadCsv('resources-by-type.csv', rs.byType.map((t) => ({ type: t.label, total: t.total, approved: t.approved, percent_of_all: t.percentOfAll })))} />}
      >
        <HBars items={rs.byType.filter((t) => t.total > 0)} labelKey="label" valueKey="total" percentKey="percentOfAll" emptyText="No resources yet." />
      </Section>

      <Section
        title="Approved resources by category"
        action={<CsvButton onClick={() => downloadCsv('resources-by-category.csv', rs.byCategory.items.map((c) => ({ category: c.name, resources: c.count, percent_of_approved: c.percentOfApproved })))} />}
      >
        <HBars items={rs.byCategory.items} labelKey="name" valueKey="count" percentKey="percentOfApproved" color={COLORS.green} emptyText="No categorised resources yet." />
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
          {rs.byCategory.note} Approved total: {fmt(rs.byCategory.approvedTotal)}. Without any category: {fmt(rs.byCategory.uncategorised)}.
        </p>
      </Section>

      <Section title="Share of library vs share of downloads"><DualBars rows={dual} /></Section>

      <Section title="Pie: what the library is made of">
        <PieChart items={rs.byType.filter((t) => t.total > 0).map((t) => ({ label: t.label, value: t.total }))} emptyText="No resources yet." />
      </Section>
      <Section title="Pie: what people download">
        <PieChart items={rs.downloadsByType.map((t) => ({ label: t.label, value: t.downloads }))} emptyText="No downloads yet." />
      </Section>

      <Section title="Downloads by type"><HBars items={rs.downloadsByType} labelKey="label" valueKey="downloads" color={COLORS.blue} emptyText="No downloads yet." /></Section>
      <Section title="Downloads by category"><HBars items={rs.downloadsByCategory} labelKey="name" valueKey="downloads" color={COLORS.violet} emptyText="No downloads yet." /></Section>

      <Section title="Resources added per month"><ColumnChart rows={rs.growth} yKey="uploaded" xKey="month" /></Section>
      <Section title="Library size over time">
        <LineChart rows={rs.growth} xKey="month" series={[
          { key: 'cumulativeUploaded', label: 'All uploads', color: COLORS.orange },
          { key: 'cumulativeApproved', label: 'Approved', color: COLORS.green },
        ]} />
      </Section>
    </>
  )
}

function HealthTab({ range }) {
  const { data, error, loading } = useApi(
    () => Promise.all([adminAnalyticsApi.system(), adminAnalyticsApi.events({ from: range.from, to: range.to })]),
    [range.from, range.to]
  )
  if (loading) return <div className="flex justify-center py-stack-lg"><LibraryLoader size={80} /></div>
  if (error) return <p className="font-body-md text-body-md text-error">{error}</p>
  const [sys, ev] = data
  const upH = Math.floor(sys.uptimeSeconds / 3600)
  const upM = Math.floor((sys.uptimeSeconds % 3600) / 60)
  const growth = (key) => {
    const prev = ev.previousTotals[key]
    return prev > 0 ? Math.round(((ev.totals[key] - prev) / prev) * 1000) / 10 : null
  }
  return (
    <>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
        <Kpi label="Server uptime" value={`${upH}h ${upM}m`} note="Since the last restart" />
        <Kpi label="Memory" value={`${fmt(sys.memoryMb)} MB`} />
        <Kpi label="Database response" value={`${fmt(sys.dbLatencyMs)} ms`} />
        <Kpi label="Queries waiting" value={fmt(sys.dbPool.waiting)} note={`${fmt(sys.dbPool.idle)} idle of ${fmt(sys.dbPool.total)}`} />
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
        {Object.keys(EVENT_LABELS).map((key) => (
          <Kpi key={key} label={EVENT_LABELS[key]} value={fmt(ev.totals[key])} growth={growth(key)} invert />
        ))}
      </section>

      {!ev.since && (
        <p className="mb-stack-md p-stack-sm rounded-lg bg-surface-container border border-outline font-label-sm text-label-sm text-on-surface-variant">
          Nothing has been logged yet. Failures are saved from the moment this update is live, so earlier days stay empty.
        </p>
      )}

      <Section title="Failures per day">
        <LineChart rows={ev.series} series={[
          { key: 'api_error', label: 'API errors', color: COLORS.rose },
          { key: 'upload_failed', label: 'Failed uploads', color: COLORS.orange },
          { key: 'ai_failure', label: 'AI failures', color: COLORS.violet },
          { key: 'preview_failed', label: 'Preview failures', color: COLORS.blue },
        ]} />
      </Section>

      <Section title="Latest failures in this period">
        {ev.recent.length === 0 ? (
          <Empty text="No failures logged in this period." />
        ) : (
          <div className="flex flex-col divide-y divide-outline">
            {ev.recent.map((e, i) => (
              <div key={`${e.at}-${i}`} className="py-2">
                <p className="font-label-sm text-label-sm text-on-surface">
                  {EVENT_LABELS[e.kind] || e.kind} · {e.at}{e.status ? ` · ${e.status}` : ''}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant break-words">{e.source}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant/70 break-words">{e.message}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}

function AdminAnalytics() {
  const [tab, setTab] = useState('Checkup')
  const [range, setRange] = useState(() => {
    const t = todayLagos()
    return { from: addDays(t, -29), to: t }
  })

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Analytics" showBack />
      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-5xl md:mx-auto px-margin-mobile">
        <div className="flex gap-2 mb-stack-md mt-stack-md">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 h-9 rounded-full font-label-md text-label-md ${tab === t ? 'bg-primary text-on-primary' : 'border border-outline text-on-surface'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {(tab === 'Overview' || tab === 'Health') && <DateFilter range={range} onChange={setRange} />}

        {tab === 'Checkup' && <CheckupTab />}
        {tab === 'Overview' && <OverviewTab range={range} />}
        {tab === 'Resources' && <ResourcesTab />}
        {tab === 'Health' && <HealthTab range={range} />}
      </main>
      <AdminNav />
    </div>
  )
}

export default AdminAnalytics