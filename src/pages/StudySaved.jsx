// student-dashboard/src/pages/StudySaved.jsx
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { studyApi } from '../services/api'

const MODES = [
  { key: 'practice', label: 'Practice', hint: 'No timer', icon: 'school' },
  { key: 'cat', label: 'CAT', hint: 'Timed test', icon: 'timer' },
  { key: 'exam', label: 'Exam', hint: 'Timed + theory', icon: 'workspace_premium' },
]
const LEVELS = ['easy', 'medium', 'hard']

const STATUS = {
  ready: { label: 'AI ready', cls: 'bg-emerald-500/15 text-emerald-400', icon: 'check_circle' },
  none: { label: 'Not read yet', cls: 'bg-sky-500/15 text-sky-400', icon: 'auto_awesome' },
  needs_ocr: { label: 'Scanned file', cls: 'bg-amber-500/15 text-amber-400', icon: 'document_scanner' },
  unsupported: { label: 'No text', cls: 'bg-surface-container-highest text-on-surface-variant', icon: 'block' },
  failed: { label: 'Unreadable', cls: 'bg-error/15 text-error', icon: 'error' },
}

const inputClass =
  'w-full h-11 px-3 bg-surface-container border border-outline rounded-xl text-on-surface focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all font-body-md'

function StudySaved() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [mode, setMode] = useState('practice')
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState('')
  const [pageFrom, setPageFrom] = useState('')
  const [pageTo, setPageTo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [pastByResource, setPastByResource] = useState({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    studyApi
      .saved()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err.message || 'Could not load your saved material.'))
      .finally(() => setLoading(false))
  }, [])

  const types = useMemo(() => [...new Set(items.map((i) => i.type_label).filter(Boolean))], [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) =>
        (filter === 'all' || i.type_label === filter) &&
        (!q || [i.title, i.author, i.course_code].filter(Boolean).join(' ').toLowerCase().includes(q))
    )
  }, [items, filter, search])

  const togglePanel = (id, isOpen) => {
    setOpenId(isOpen ? null : id)
    if (isOpen || pastByResource[id]) return
    studyApi
      .pastQuestions(id)
      .then((res) => setPastByResource((prev) => ({ ...prev, [id]: res.items || [] })))
      .catch(() => setPastByResource((prev) => ({ ...prev, [id]: [] })))
  }

  const handleGenerate = async (resourceId) => {
    setGenerating(true)
    setError('')
    try {
      const res = await studyApi.generate({
        resourceId,
        mode,
        difficulty,
        count: count ? Number(count) : undefined,
        pageFrom: pageFrom ? Number(pageFrom) : undefined,
        pageTo: pageTo ? Number(pageTo) : undefined,
      })
      navigate(`/reading-space/practice/${res.id}`)
    } catch (err) {
      setError(err.message || 'Could not generate questions.')
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Saved material" showBack />

      <main className="pb-24 pt-[68px] md:pt-36 md:max-w-4xl md:mx-auto px-margin-mobile">
        <section className="relative overflow-hidden rounded-2xl border border-outline bg-gradient-to-br from-orange-500/15 via-surface-container to-surface-container p-5 mb-stack-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-headline-md text-headline-md font-display text-on-surface">Your study shelf</h1>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                Read it, take notes on it, or turn it into practice questions.
              </p>
            </div>
            <div className="flex-none flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <span className="font-display text-xl leading-none">{items.length}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-90">saved</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && items.length > 0 && (
          <div className="mb-stack-md flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, author or course code"
                className="w-full h-12 pl-12 pr-4 bg-surface-container border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all font-body-md"
              />
            </div>
            {types.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-margin-mobile px-margin-mobile">
                {['all', ...types].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`flex-none px-4 h-9 rounded-full font-label-md text-label-md transition-colors ${
                      filter === t
                        ? 'bg-orange-500 text-white'
                        : 'bg-surface-container border border-outline text-on-surface-variant'
                    }`}
                  >
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-stack-sm">bookmarks</span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Nothing saved yet. Save a book or past question from the library and it will show up here.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && filtered.length === 0 && (
          <p className="text-center py-stack-lg font-body-md text-body-md text-on-surface-variant">
            No saved material matches that.
          </p>
        )}

        <div className="grid gap-gutter md:grid-cols-2">
          {filtered.map((item) => {
            const status = STATUS[item.text_status] || STATUS.none
            const blocked = ['needs_ocr', 'unsupported', 'failed'].includes(item.text_status)
            const open = openId === item.id
            const past = pastByResource[item.id] || []
            return (
              <article
                key={item.id}
                className={`rounded-2xl bg-surface-container border overflow-hidden transition-all ${
                  open
                    ? 'md:col-span-2 border-orange-500/40 shadow-lg shadow-orange-500/10'
                    : 'border-outline hover:border-orange-500/30'
                }`}
              >
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-28 flex-none rounded-lg overflow-hidden bg-surface-container-highest border border-outline/50 shadow-xl flex items-center justify-center">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-3xl">menu_book</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow flex flex-col">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface line-clamp-2">{item.title}</h3>
                    {item.author && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">{item.author}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      {item.type_label && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-label-sm text-label-sm">
                          {item.type_label}
                        </span>
                      )}
                      {item.course_code && (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                          {item.course_code}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${status.cls}`}>
                        <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                  <Link
                    to={`/resources/${item.id}/read`}
                    className="min-w-0 flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl bg-surface-container-low border border-outline text-[13px] font-medium leading-none text-on-surface active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                    Read
                  </Link>
                  <Link
                    to={`/reading-space/notes?resource=${item.id}`}
                    className="min-w-0 flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl bg-surface-container-low border border-outline text-[13px] font-medium leading-none text-on-surface active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[22px]">edit_note</span>
                    Notes
                  </Link>
                  <button
                    onClick={() => togglePanel(item.id, open)}
                    disabled={blocked}
                    className={`min-w-0 flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl text-[13px] font-semibold leading-none text-white bg-gradient-to-r from-orange-500 to-amber-500 transition-transform ${
                      blocked ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{open ? 'expand_less' : 'quiz'}</span>
                    Questions
                  </button>
                </div>

                {blocked && (
                  <p className="px-4 pb-4 -mt-1 font-label-sm text-label-sm text-on-surface-variant">
                    {item.text_status === 'needs_ocr'
                      ? 'Scanned file: questions need text reading, which is not done for this one yet.'
                      : item.text_status === 'failed'
                        ? 'We could not read this file.'
                        : 'Questions are not available for this file type.'}
                  </p>
                )}

                {open && !blocked && (
                  <div className="border-t border-outline bg-surface-container-low/60 p-4 flex flex-col gap-4">
                    {past.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                          Past questions for {item.course_code}
                        </p>
                        {past.map((pq) => (
                          <Link
                            key={pq.id}
                            to={`/resources/${pq.id}/read`}
                            className="flex items-center gap-3 p-2 rounded-xl bg-surface-container border border-outline active:scale-[0.98] transition-transform"
                          >
                            <div className="w-10 h-12 flex-none rounded bg-surface-container-highest overflow-hidden flex items-center justify-center border border-outline/50">
                              {pq.thumbnail_url ? (
                                <img src={pq.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="material-symbols-outlined text-orange-400">quiz</span>
                              )}
                            </div>
                            <p className="flex-grow min-w-0 font-body-md text-body-md text-on-surface line-clamp-2">{pq.title}</p>
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                          </Link>
                        ))}
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Or let AI write fresh questions from this material:
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Mode</p>
                      <div className="grid grid-cols-3 gap-2">
                        {MODES.map((m) => (
                          <button
                            key={m.key}
                            onClick={() => setMode(m.key)}
                            className={`flex flex-col items-center gap-0.5 py-3 rounded-xl border transition-colors ${
                              mode === m.key
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-surface-container border-outline text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
                            <span className="font-label-md text-label-md font-semibold">{m.label}</span>
                            <span className="text-[10px] opacity-80">{m.hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Difficulty</p>
                      <div className="grid grid-cols-3 gap-2">
                        {LEVELS.map((l) => (
                          <button
                            key={l}
                            onClick={() => setDifficulty(l)}
                            className={`h-10 rounded-xl border capitalize font-label-md text-label-md transition-colors ${
                              difficulty === l
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-surface-container border-outline text-on-surface-variant'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" min={5} max={30} value={count} onChange={(e) => setCount(e.target.value)} placeholder="How many" className={inputClass} />
                      <input type="number" min={1} value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} placeholder="From page" className={inputClass} />
                      <input type="number" min={1} value={pageTo} onChange={(e) => setPageTo(e.target.value)} placeholder="To page" className={inputClass} />
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant -mt-2">
                      How many: 5 to 30. Leave the pages empty to cover the whole file, or set a range to focus on a chapter.
                    </p>

                    <button
                      onClick={() => handleGenerate(item.id)}
                      disabled={generating}
                      className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-label-md text-label-md font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 ${
                        generating ? 'opacity-70 cursor-wait' : 'active:scale-[0.98] transition-transform'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${generating ? 'animate-spin' : ''}`}>
                        {generating ? 'progress_activity' : 'auto_awesome'}
                      </span>
                      {generating ? 'Writing your questions… up to a minute' : 'Generate questions'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default StudySaved