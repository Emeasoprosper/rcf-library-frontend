// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminAiLibrary.jsx
// Everything the AI adds to the library, and the switches that control it:
//   - which AI is writing (free Gemini, or Claude when a key is set)
//   - "Write notes now" for any course
//   - the live queue of lecture notes being written (progress, step, retry)
//   - books written by AI and files Bro Paul added from WhatsApp, each
//     publishable/hideable
//   - switches (superadmin): AI notes, auto-publish, ask groups, auto-upload,
//     and which WhatsApp groups get asked for past questions
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import { adminApi } from '../../services/api'

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SWITCHES = [
  ['aiLectureNotes', 'AI writes missing lecture notes', 'When someone asks (app or WhatsApp) for lecture notes we don\'t have, the AI researches the course and writes them.'],
  ['aiNotesAutoPublish', 'Publish AI notes without review', 'Notes go live and the person who asked gets the link straight away. Off: they wait for you here.'],
  ['askForMaterials', 'Ask groups for missing past questions', 'Bro Paul asks the groups switched on below: "Does anyone have…? Send it to me."'],
  ['autoUploadMaterials', 'Bro Paul adds files people send him', 'PDFs, Word, PowerPoint and photos sent to him in DM, or in an "ask" group when clearly for the library.'],
  ['autoPublishUploads', 'Publish his uploads without review', 'Off: they wait for you here before going live.'],
]

const JOB_STYLE = {
  queued: ['Waiting', 'bg-surface-container-highest text-on-surface-variant'],
  running: ['Writing', 'bg-primary/15 text-primary'],
  done: ['Done', 'bg-emerald-500/15 text-emerald-500'],
  failed: ['Failed', 'bg-rose-500/15 text-rose-400'],
}

function Job({ job, onRetry, onRegenerate, onOpen }) {
  const [label, chip] = JOB_STYLE[job.status] || JOB_STYLE.queued
  const active = job.status === 'running' || job.status === 'queued'
  return (
    <div className="py-4 border-b border-outline/70 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body-md text-body-md font-semibold text-on-surface truncate">
            {job.resource_title || [job.course_code, job.title].filter(Boolean).join(' – ') || 'Lecture notes'}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {job.requested_by || 'Requested'} · {timeAgo(job.created_at)}
            {job.requesters > 0 ? ` · ${job.requesters} waiting` : ''}
            {job.provider ? ` · ${job.provider}` : ''}
          </p>
        </div>
        <span className={`flex-none px-2.5 py-1 rounded-full font-label-sm text-label-sm ${chip}`}>{label}</span>
      </div>
      {active && (
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-[width] duration-700 ${job.status === 'queued' ? 'animate-pulse' : ''}`}
              style={{ width: `${Math.max(job.progress || 0, job.status === 'running' ? 4 : 0)}%` }}
            />
          </div>
          <p className={`mt-1 font-label-sm text-label-sm truncate ${job.retry_after ? 'text-amber-400' : 'text-on-surface-variant'}`} title={job.step || ''}>
            {job.status === 'queued'
              ? job.step || 'In the queue (one course is written at a time)'
              : `${job.progress || 0}% · ${job.step || 'Starting'}`}
          </p>
          {job.retry_after && (
            <button onClick={() => onRetry(job)} className="mt-1.5 h-8 px-3 rounded-full border border-outline font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high">
              Try now
            </button>
          )}
        </div>
      )}
      {job.status === 'failed' && (
        <div className="mt-2 flex items-center gap-3">
          <p className="flex-1 min-w-0 font-label-sm text-label-sm text-rose-400 truncate" title={job.error}>{job.error}</p>
          <button onClick={() => onRetry(job)} className="flex-none h-8 px-3 rounded-full bg-violet-500 text-white font-label-sm text-label-sm font-semibold">
            Regenerate
          </button>
        </div>
      )}
      {job.status === 'done' && (
        <div className="mt-1.5 flex items-center gap-4">
          {job.resource_id && (
            <button onClick={() => onOpen(job.resource_id)} className="font-label-sm text-label-sm font-semibold text-primary">
              Open the notes →
            </button>
          )}
          <button onClick={() => onRegenerate(job)} className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface">
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}

function Book({ book, onToggle, onOpen, busy }) {
  const live = book.status === 'approved'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-outline/70 last:border-0">
      <button onClick={() => onOpen(book.id)} className="w-11 h-14 flex-none rounded-md overflow-hidden bg-surface-container-high flex items-center justify-center">
        {book.thumbnail_url ? (
          <img src={book.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant">{book.ai_origin === 'generated' ? 'edit_note' : 'description'}</span>
        )}
      </button>
      <button onClick={() => onOpen(book.id)} className="min-w-0 flex-1 text-left">
        <p className="font-body-md text-body-md text-on-surface truncate">{book.title}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
          {[book.course_code, book.type?.replace('_', ' '), timeAgo(book.created_at), book.download_count ? `${book.download_count} downloads` : null].filter(Boolean).join(' · ')}
        </p>
      </button>
      <button
        onClick={() => onToggle(book)}
        disabled={busy}
        className={`flex-none h-8 px-3 rounded-full font-label-sm text-label-sm font-semibold border transition-colors disabled:opacity-50 ${
          live ? 'border-emerald-500/50 text-emerald-500' : 'border-amber-500/60 text-amber-500'
        }`}
        title={live ? 'Live in the library. Tap to hide it.' : 'Hidden. Tap to publish it.'}
      >
        {busy ? '…' : live ? 'Live' : 'Publish'}
      </button>
    </div>
  )
}

function AdminAiLibrary() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('generated')
  const [form, setForm] = useState({ courseCode: '', title: '' })
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      setData(await adminApi.aiLibrary())
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load the AI library.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Watch the queue live while something is being written.
  const busy = data?.jobs?.some((j) => j.status === 'queued' || j.status === 'running')
  useEffect(() => {
    if (!busy) return undefined
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [busy, load])

  const open = (id) => navigate(`/library/${id}`)

  const create = async (e) => {
    e.preventDefault()
    if (creating || (!form.courseCode.trim() && form.title.trim().length < 3)) return
    setCreating(true)
    try {
      await adminApi.createAiNotes(form)
      setForm({ courseCode: '', title: '' })
      await load()
    } catch (err) {
      setError(err.message || 'Could not start the notes.')
    } finally {
      setCreating(false)
    }
  }

  const retry = async (job) => {
    try {
      await adminApi.retryAiJob(job.id)
      await load()
    } catch (err) {
      setError(err.message || 'Could not retry.')
    }
  }

  // Writes a fresh version of finished notes (it becomes "… II").
  const regenerate = async (job) => {
    try {
      await adminApi.createAiNotes({ courseCode: job.course_code || '', title: job.title || job.resource_title || '' })
      await load()
    } catch (err) {
      setError(err.message || 'Could not regenerate.')
    }
  }

  const toggleBook = async (book) => {
    setBusyId(book.id)
    try {
      const { status } = await adminApi.setAiBookStatus(book.id, book.status === 'approved' ? 'pending' : 'approved')
      setData((d) => ({ ...d, books: d.books.map((b) => (b.id === book.id ? { ...b, status } : b)) }))
    } catch (err) {
      setError(err.message || 'Could not update that book.')
    } finally {
      setBusyId(null)
    }
  }

  const setSwitch = async (key, value) => {
    setData((d) => ({ ...d, settings: { ...d.settings, [key]: value } }))
    try {
      await adminApi.saveWhatsappSettings({ [key]: value })
    } catch (err) {
      setError(err.message || 'Could not save that switch.')
      load()
    }
  }

  const setGroupAsk = async (group, value) => {
    setData((d) => ({ ...d, groups: d.groups.map((g) => (g.jid === group.jid ? { ...g, askForMaterials: value } : g)) }))
    try {
      await adminApi.saveWhatsappGroupSettings(group.jid, { askForMaterials: value })
    } catch (err) {
      setError(err.message || 'Could not save that group.')
      load()
    }
  }

  const books = (data?.books || []).filter((b) => b.ai_origin === tab)
  const counts = {
    generated: (data?.books || []).filter((b) => b.ai_origin === 'generated').length,
    bot_upload: (data?.books || []).filter((b) => b.ai_origin === 'bot_upload').length,
  }
  const provider = data?.provider

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="AI Library" showBack />

      <main className="pb-32 pt-[76px] md:pt-24 md:max-w-4xl md:mx-auto px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {!data && !error && <LibraryLoader size={120} fullScreen />}

        {data && (
          <>
            {/* who's writing + totals */}
            <section className="pb-stack-lg border-b border-outline">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm ${provider ? 'bg-primary/15 text-primary' : 'bg-rose-500/15 text-rose-400'}`}>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  {provider
                    ? `Writing with ${provider.name === 'claude' ? 'Claude' : provider.name === 'groq' ? 'Groq (free)' : 'Gemini (free)'} · ${provider.model}`
                    : 'No AI key on the server'}
                </span>
                {data.worker?.lastSeen && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm ${
                      data.worker.online ? 'bg-sky-500/15 text-sky-300' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${data.worker.online ? 'bg-sky-400 animate-pulse' : 'bg-on-surface-variant/50'}`} />
                    {data.worker.online
                      ? `Your Kaggle AI is online · ${data.worker.model || 'own model'} · ${data.worker.jobsDone} written`
                      : `Your Kaggle AI is off (last seen ${timeAgo(data.worker.lastSeen)})`}
                  </span>
                )}
                {provider?.backups?.includes('groq') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm bg-emerald-500/15 text-emerald-400">
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    Backup when Gemini runs out: Groq (free)
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[
                  [counts.generated, 'notes written'],
                  [counts.bot_upload, 'added by Bro Paul'],
                  [data.jobs.filter((j) => j.status === 'queued' || j.status === 'running').length, 'being written'],
                ].map(([n, label]) => (
                  <div key={label}>
                    <p className="font-display text-[34px] leading-none font-extrabold tabular-nums">{n}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* write now */}
            <section className="py-stack-lg border-b border-outline">
              <h2 className="font-label-md text-label-md uppercase tracking-[0.14em] text-on-surface-variant">Write lecture notes now</h2>
              <form onSubmit={create} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={form.courseCode}
                  onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
                  placeholder="Course code, e.g. MTH 211"
                  className="sm:w-48 h-11 px-4 rounded-full bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Course title (optional with a code)"
                  className="flex-1 h-11 px-4 rounded-full bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={creating || (!form.courseCode.trim() && form.title.trim().length < 3)}
                  className="h-11 px-5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  {creating ? 'Starting…' : 'Write notes'}
                </button>
              </form>
              <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
                Researches the course, plans a 12–14 week scheme of work, writes every week, then a revision chapter. Takes about 5–15 minutes. Author: RCF MOUAU, with the RCF logo.
              </p>
            </section>

            {/* queue */}
            <section className="py-stack-lg border-b border-outline">
              <h2 className="font-label-md text-label-md uppercase tracking-[0.14em] text-on-surface-variant">Writing queue</h2>
              {data.jobs.length === 0 ? (
                <p className="py-6 font-body-md text-body-md text-on-surface-variant">Nothing yet. Notes appear here when someone asks or you start some above.</p>
              ) : (
                data.jobs.slice(0, 20).map((job) => <Job key={job.id} job={job} onRetry={retry} onRegenerate={regenerate} onOpen={open} />)
              )}
            </section>

            {/* books */}
            <section className="py-stack-lg border-b border-outline">
              <div className="flex gap-5 border-b border-outline/70">
                {[
                  ['generated', `Written by AI (${counts.generated})`],
                  ['bot_upload', `Added by Bro Paul (${counts.bot_upload})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`relative pb-2.5 font-label-md text-label-md transition-colors ${tab === value ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}
                  >
                    {label}
                    <span className={`absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-on-surface transition-transform duration-300 origin-left ${tab === value ? 'scale-x-100' : 'scale-x-0'}`} />
                  </button>
                ))}
              </div>
              {books.length === 0 ? (
                <p className="py-6 font-body-md text-body-md text-on-surface-variant">
                  {tab === 'generated' ? 'No AI-written notes yet.' : 'Nothing sent to Bro Paul yet.'}
                </p>
              ) : (
                books.map((b) => <Book key={b.id} book={b} onToggle={toggleBook} onOpen={open} busy={busyId === b.id} />)
              )}
            </section>

            {/* switches */}
            <section className="py-stack-lg">
              <h2 className="font-label-md text-label-md uppercase tracking-[0.14em] text-on-surface-variant">Switches</h2>
              {!data.canEdit && <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Only a superadmin can change these.</p>}
              <div className="mt-2">
                {SWITCHES.map(([key, label, hint]) => (
                  <div key={key} className="flex items-start gap-4 py-3.5 border-b border-outline/70 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md text-body-md text-on-surface">{label}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{hint}</p>
                    </div>
                    <div className={data.canEdit ? '' : 'opacity-50 pointer-events-none'}>
                      <ToggleSwitch checked={Boolean(data.settings[key])} onChange={(v) => setSwitch(key, v)} label={label} />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mt-stack-lg font-body-md text-body-md font-semibold text-on-surface">Groups Bro Paul asks for past questions</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                In these groups he asks "does anyone have…?" when someone needs past questions we don't have, and he picks up files shared there for the library.
              </p>
              <div className="mt-2">
                {data.groups.length === 0 && <p className="py-4 font-label-md text-label-md text-on-surface-variant">Bro Paul isn't in any groups yet.</p>}
                {data.groups.map((g) => (
                  <div key={g.jid} className="flex items-center gap-4 py-3 border-b border-outline/70 last:border-0">
                    <span className="material-symbols-outlined text-on-surface-variant">groups</span>
                    <p className={`flex-1 min-w-0 truncate font-body-md text-body-md ${g.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {g.name || 'Unnamed group'}{g.enabled ? '' : ' (bot off here)'}
                    </p>
                    <div className={data.canEdit ? '' : 'opacity-50 pointer-events-none'}>
                      <ToggleSwitch checked={g.askForMaterials} onChange={(v) => setGroupAsk(g, v)} label={`Ask ${g.name || 'group'} for materials`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminAiLibrary
