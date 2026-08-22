// pages/RequestMaterial.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { communityApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const statusStyle = {
  open: { label: 'Pending', chip: 'bg-amber-500/20 text-amber-400', icon: 'schedule' },
  fulfilled: { label: 'Fulfilled', chip: 'bg-emerald-500/20 text-emerald-400', icon: 'check_circle' },
  declined: { label: 'Declined', chip: 'bg-rose-500/20 text-rose-400', icon: 'cancel' },
}

function RequestMaterial() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  // Prefilled when arriving from Search.jsx's "Request this material"
  // prompt, shown after a zero-result search. Empty for a normal
  // manual visit to this page.
  const prefillTitle = location.state?.prefillTitle || ''
  const [form, setForm] = useState({ title: prefillTitle, courseCode: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const [myRequests, setMyRequests] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    communityApi
      .myRequests()
      .then(({ items }) => setMyRequests(items))
      .catch(() => setMyRequests([]))
      .finally(() => setLoadingHistory(false))
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      // department/level come from the user's own profile (Complete
      // Profile) instead of asking them to re-type it — "user
      // information where appropriate" captured automatically.
      // searchQuery is only set when this page was reached from a
      // failed search, so the admin can see exactly what was searched.
      const details = {
        department: user?.department || null,
        level: user?.level || null,
        searchQuery: prefillTitle || null,
      }
      const { request } = await communityApi.createRequest({ ...form, details })
      setMyRequests((prev) => [request, ...prev])
      setForm({ title: '', courseCode: '', notes: '' })
      setSent(true)
      setTimeout(() => setSent(false), 1800)
    } catch (err) {
      setError(err.message || 'Could not send your request — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Request Material" showBack />
      <main className="pb-32 pt-[68px] px-margin-mobile">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-stack-lg mt-stack-md shadow-lg">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-[120px] rotate-[-12deg] pointer-events-none">
            search
          </span>
          <h2 className="relative z-10 font-headline-lg text-headline-lg font-display text-white">
            Can't find what you need?
          </h2>
          <p className="relative z-10 font-body-md text-body-md text-white/80 mt-1">
            Tell us what to add and we'll try to source it.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-gutter mt-stack-lg">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant">What are you looking for?</label>
            <input
              value={form.title}
              onChange={update('title')}
              required
              placeholder="e.g. Systematic Theology Vol. III"
              className="w-full h-12 mt-1 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant">Course code (optional)</label>
            <input
              value={form.courseCode}
              onChange={update('courseCode')}
              placeholder="e.g. CSC 421"
              className="w-full h-12 mt-1 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant">Additional notes</label>
            <textarea
              value={form.notes}
              onChange={update('notes')}
              rows={4}
              placeholder="Author, edition, department, why you need it…"
              className="w-full mt-1 p-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>

          {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="w-full py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all mt-stack-sm disabled:opacity-50"
          >
            {submitting ? 'Sending…' : sent ? 'Sent ✓' : 'Send Request'}
          </button>
        </form>

        <section className="mt-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            Your Requests
          </h2>

          {loadingHistory && (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
          )}

          {!loadingHistory && myRequests.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing requested yet.
            </p>
          )}

          <div className="flex flex-col gap-gutter">
            {myRequests.map((r) => {
              const style = statusStyle[r.status] || statusStyle.open
              return (
                <div
                  key={r.id}
                  className="p-stack-md rounded-xl bg-surface-container border border-outline"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-body-md text-body-md text-on-surface font-semibold min-w-0 truncate">
                      {r.title}
                    </p>
                    <span
                      className={`flex-none flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-label-sm ${style.chip}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{style.icon}</span>
                      {style.label}
                    </span>
                  </div>
                  {r.course_code && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {r.course_code}
                    </p>
                  )}
                  {r.status === 'fulfilled' && r.fulfilled_resource_title && (
                    <button
                      onClick={() => navigate(`/resources/${r.fulfilled_resource_id}`)}
                      className="mt-2 font-label-sm text-label-sm text-primary underline underline-offset-2"
                    >
                      View "{r.fulfilled_resource_title}"
                    </button>
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

export default RequestMaterial