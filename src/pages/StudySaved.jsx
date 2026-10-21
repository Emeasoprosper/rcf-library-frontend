// student-dashboard/src/pages/StudySaved.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { studyApi } from '../services/api'

const MODES = [
  { key: 'practice', label: 'Practice', hint: 'No timer' },
  { key: 'cat', label: 'CAT', hint: 'Timed test' },
  { key: 'exam', label: 'Exam', hint: 'Timed + theory' },
]
const LEVELS = ['easy', 'medium', 'hard']

const inputClass =
  'w-full h-11 px-3 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md'

function pill(active) {
  return `flex-1 py-2 rounded-lg font-label-md text-label-md transition-colors ${
    active ? 'bg-primary text-on-primary' : 'bg-surface-container-low border border-outline text-on-surface-variant'
  }`
}

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

  useEffect(() => {
    studyApi
      .saved()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err.message || 'Could not load your saved material.'))
      .finally(() => setLoading(false))
  }, [])

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

      <main className="pb-24 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">bookmarks</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing saved yet. Save a book or past question from the library and it will show up here.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {items.map((item) => {
            const blocked = item.text_status === 'needs_ocr' || item.text_status === 'unsupported'
            const open = openId === item.id
            return (
              <div key={item.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                <div className="flex gap-4">
                  <div className="w-14 h-20 bg-surface-container-highest rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">menu_book</span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface line-clamp-2">{item.title}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {[item.type_label, item.author, item.course_code].filter(Boolean).join(' • ')}
                    </p>
                    {blocked && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        {item.text_status === 'needs_ocr'
                          ? 'Scanned file: questions need text reading (coming soon).'
                          : 'Questions are not available for this file type.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/resources/${item.id}/read`}
                    className="flex-1 py-2 rounded-lg text-center bg-surface-container-low border border-outline font-label-md text-label-md text-on-surface"
                  >
                    Read
                  </Link>
                  <Link
                    to={`/reading-space/notes?resource=${item.id}`}
                    className="flex-1 py-2 rounded-lg text-center bg-surface-container-low border border-outline font-label-md text-label-md text-on-surface"
                  >
                    Notes
                  </Link>
                  <button
                    onClick={() => setOpenId(open ? null : item.id)}
                    disabled={blocked}
                    className={`flex-1 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Questions
                  </button>
                </div>

                {open && !blocked && (
                  <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-outline">
                    <div className="flex gap-2">
                      {MODES.map((m) => (
                        <button key={m.key} onClick={() => setMode(m.key)} className={pill(mode === m.key)}>
                          {m.label}
                          <span className="block text-[10px] opacity-70">{m.hint}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {LEVELS.map((l) => (
                        <button key={l} onClick={() => setDifficulty(l)} className={`${pill(difficulty === l)} capitalize`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="number" min={5} max={30} value={count} onChange={(e) => setCount(e.target.value)} placeholder="How many (5-30)" className={inputClass} />
                    </div>
                    <div className="flex gap-2">
                      <input type="number" min={1} value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} placeholder="From page" className={inputClass} />
                      <input type="number" min={1} value={pageTo} onChange={(e) => setPageTo(e.target.value)} placeholder="To page" className={inputClass} />
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Leave the pages empty to cover the whole file. Set a range to focus on a chapter.
                    </p>
                    <button
                      onClick={() => handleGenerate(item.id)}
                      disabled={generating}
                      className={`w-full py-3.5 rounded-lg font-label-md text-label-md font-semibold bg-orange-500 text-white ${generating ? 'opacity-60 cursor-wait' : 'active:scale-[0.98]'}`}
                    >
                      {generating ? 'Writing your questions… up to a minute' : 'Generate questions'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default StudySaved