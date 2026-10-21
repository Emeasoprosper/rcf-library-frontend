// student-dashboard/src/pages/ReadingSpace.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { readingSpaceApi } from '../services/api'

const TZ = 'Africa/Lagos'

function lastSevenDays() {
  const out = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000)
    out.push({
      key: d.toLocaleDateString('en-CA', { timeZone: TZ }),
      label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ }),
    })
  }
  return out
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function defaultStart() {
  const d = new Date(Date.now() + 3600000)
  d.setMinutes(0, 0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatPlanTime(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ,
  })
}

const inputClass =
  'w-full h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md'

function ReadingSpace() {
  const [overview, setOverview] = useState({ days: [], weekSeconds: 0, weekSessions: 0 })
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(defaultStart())
  const [durationMin, setDurationMin] = useState(30)
  const [notes, setNotes] = useState('')

  const loadPlans = useCallback(
    () => readingSpaceApi.plans().then((res) => setPlans(res.items || [])),
    []
  )

  useEffect(() => {
    Promise.all([readingSpaceApi.overview().then(setOverview), loadPlans()])
      .catch((err) => setError(err.message || 'Could not load your Reading Space.'))
      .finally(() => setLoading(false))
  }, [loadPlans])

  const handleAdd = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      await readingSpaceApi.createPlan({
        title: title.trim(),
        plannedStart: new Date(start).toISOString(),
        durationMin: Number(durationMin) || 30,
        notes: notes.trim() || null,
      })
      setTitle('')
      setNotes('')
      setDurationMin(30)
      setStart(defaultStart())
      setShowForm(false)
      await loadPlans()
    } catch (err) {
      setError(err.message || 'Could not save the plan.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (plan) => {
    try {
      await readingSpaceApi.setPlanDone(plan.id, !plan.completed_at)
      await loadPlans()
    } catch (err) {
      setError(err.message || 'Could not update the plan.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await readingSpaceApi.deletePlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete the plan.')
    }
  }

  const byDay = new Map(overview.days.map((d) => [d.day, d.seconds]))
  const week = lastSevenDays().map((d) => ({ ...d, seconds: byDay.get(d.key) || 0 }))
  const maxSeconds = Math.max(...week.map((d) => d.seconds), 1)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Reading Space" showBack />

      <main className="pb-24 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        <section className="grid grid-cols-3 gap-gutter mb-stack-lg">
          {[
            { to: '/reading-space/saved', icon: 'bookmarks', label: 'Saved material' },
            { to: '/reading-space/notes', icon: 'edit_note', label: 'My notes' },
            { to: '/reading-space/practice', icon: 'quiz', label: 'Practice' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-surface-container border border-outline active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-primary text-[26px]">{item.icon}</span>
              <span className="font-label-md text-label-md text-on-surface text-center">{item.label}</span>
            </Link>
          ))}
        </section>

        {!loading && (
          <>
            <section className="mb-stack-lg">
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
                This week
              </h2>
              <div className="p-stack-md rounded-xl bg-surface-container border border-outline">
                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="font-headline-md text-headline-md font-display text-on-surface">
                      {overview.weekSeconds ? formatDuration(overview.weekSeconds) : '0 min'}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Time reading</p>
                  </div>
                  <div>
                    <p className="font-headline-md text-headline-md font-display text-on-surface">{overview.weekSessions}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Sessions</p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2 h-24">
                  {week.map((d) => (
                    <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <div
                        className="w-full rounded bg-primary/80"
                        style={{ height: `${Math.max((d.seconds / maxSeconds) * 100, d.seconds ? 8 : 4)}%`, opacity: d.seconds ? 1 : 0.25 }}
                        title={d.seconds ? formatDuration(d.seconds) : 'No reading'}
                      />
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{d.label}</span>
                    </div>
                  ))}
                </div>
                {overview.weekSeconds === 0 && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
                    Your reading time will show here as you read in the app.
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-stack-sm">
                <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Reading plan
                </h2>
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center gap-1 px-3 h-9 rounded-full bg-primary text-on-primary font-label-md text-label-md active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
                  {showForm ? 'Cancel' : 'Add plan'}
                </button>
              </div>

              {showForm && (
                <div className="flex flex-col gap-stack-md mb-stack-md p-stack-md rounded-xl bg-surface-container border border-outline">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">What will you read?</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                      placeholder="e.g. CSC 415 past questions"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">When</label>
                      <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
                    </div>
                    <div className="w-28">
                      <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Minutes</label>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={durationMin}
                        onChange={(e) => setDurationMin(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!title.trim() || saving}
                    className={`w-full py-3.5 rounded-lg font-label-md text-label-md font-semibold bg-primary text-on-primary transition-all ${
                      !title.trim() || saving ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
                    }`}
                  >
                    {saving ? 'Saving…' : 'Save plan'}
                  </button>
                </div>
              )}

              {plans.length === 0 && !showForm && (
                <div className="flex flex-col items-center text-center py-stack-lg">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">event_note</span>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    No reading plans yet. Add one to stay on track.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-gutter">
                {plans.map((plan) => {
                  const done = Boolean(plan.completed_at)
                  const missed = !done && new Date(plan.planned_start).getTime() + plan.duration_min * 60000 < Date.now()
                  return (
                    <div
                      key={plan.id}
                      className={`flex items-start gap-3 p-stack-md rounded-xl bg-surface-container border border-outline ${done ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => handleToggle(plan)}
                        aria-label={done ? 'Mark as not done' : 'Mark as done'}
                        className="flex-none mt-0.5 text-primary"
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {done ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                      <div className="flex-grow min-w-0">
                        <p className={`font-body-md text-body-md font-semibold text-on-surface ${done ? 'line-through' : ''}`}>
                          {plan.title}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {formatPlanTime(plan.planned_start)} • {plan.duration_min} min
                          {missed && <span className="text-error"> • Missed</span>}
                        </p>
                        {plan.resource_title && (
                          <p className="font-label-sm text-label-sm text-primary truncate">{plan.resource_title}</p>
                        )}
                        {plan.notes && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{plan.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        aria-label="Delete plan"
                        className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default ReadingSpace