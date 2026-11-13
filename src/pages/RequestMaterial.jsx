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
  const [kind, setKind] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  // What the AI did with a lecture-notes request: 'queued' | 'exists' + link.
  const [aiNotes, setAiNotes] = useState(null)

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
        type: kind || null,
      }
      const { request, aiNotes: ai } = await communityApi.createRequest({ ...form, details })
      setMyRequests((prev) => [ai?.status === 'exists' ? { ...request, status: 'fulfilled' } : request, ...prev])
      setAiNotes(ai && ['queued', 'exists'].includes(ai.status) ? ai : null)
      setForm({ title: '', courseCode: '', notes: '' })
      setKind('')
      setSent(true)
      setTimeout(() => setSent(false), 1800)
    } catch (err) {
      setError(err.message || 'Could not send your request — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-80 lg:pr-80">
      <TopAppBar title="Request Material" showBack />
      <main className="pb-32 pt-[68px] md:pt-24 px-margin-mobile">
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

        {aiNotes && (
          <section className="mt-stack-md p-stack-md rounded-2xl border border-primary/40 bg-primary/10 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[26px] flex-none">{aiNotes.status === 'queued' ? 'edit_note' : 'menu_book'}</span>
            <div className="min-w-0">
              {aiNotes.status === 'queued' ? (
                <>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">We're writing your lecture notes now ✍️</p>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">
                    Full notes with a scheme of work, clear explanations, worked examples and practice questions. It takes a few minutes; you'll get a notification with the link when they're ready.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">Good news: we already have notes for this 📚</p>
                  <button type="button" onClick={() => navigate(`/library/${aiNotes.resourceId}`)} className="mt-1 font-label-md text-label-md text-primary font-semibold">
                    Open them →
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-gutter mt-stack-lg">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant">What kind of material?</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {[
                ['lecture_notes', 'Lecture notes', 'edit_note'],
                ['past_question', 'Past questions', 'quiz'],
                ['book', 'Book', 'menu_book'],
                ['', 'Other', 'more_horiz'],
              ].map(([value, label, icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setKind(value)}
                  className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 font-label-md text-label-md transition-colors ${
                    kind === value ? 'bg-primary text-on-primary border-primary' : 'border-outline text-on-surface-variant hover:border-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {kind === 'lecture_notes' && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                ✨ If we don't have notes for this course yet, our AI will write comprehensive ones for you. Add the course code for the best result.
              </p>
            )}
          </div>
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
            <div className="flex flex-col items-center text-center py-stack-lg">
              <img src="/NoUploadsYet.png" alt="" className="w-36 h-36 object-contain mb-stack-md" />
              <p className="font-body-md text-body-md text-on-surface-variant">
                Nothing requested yet.
              </p>
            </div>
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
                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-10 h-14 rounded-md overflow-hidden bg-surface-container-high border border-outline flex-none">
                        {r.fulfilled_resource_thumbnail_url ? (
                          <img src={r.fulfilled_resource_thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">menu_book</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-label-sm text-label-sm text-on-surface truncate">{r.fulfilled_resource_title}</p>
                        <button
                          onClick={() => navigate(`/library/${r.fulfilled_resource_id}`)}
                          className="mt-1 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm active:scale-[0.98] hover:opacity-90 transition-all"
                        >
                          See Resource
                        </button>
                      </div>
                    </div>
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