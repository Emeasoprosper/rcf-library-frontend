// student-dashboard/src/pages/StudyPractice.jsx
// /reading-space/practice          -> list of generated question sets
// /reading-space/practice/:setId   -> take the set, then see results
import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { studyApi } from '../services/api'

const SHELL =
  'min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out'
const MAIN = 'pb-24 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile'

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function SetList() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    studyApi
      .sets()
      .then((res) => setSets(res.items || []))
      .catch((err) => setError(err.message || 'Could not load your question sets.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e, id) => {
    e.preventDefault()
    try {
      await studyApi.deleteSet(id)
      setSets((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete.')
    }
  }

  return (
    <div className={SHELL}>
      <TopAppBar title="Practice" showBack />
      <main className={MAIN}>
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}
        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && sets.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">quiz</span>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
              No question sets yet. Pick a saved book and generate some.
            </p>
            <Link to="/reading-space/saved" className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              Go to saved material
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {sets.map((s) => (
            <Link
              key={s.id}
              to={`/reading-space/practice/${s.id}`}
              className="flex items-center gap-3 p-stack-md rounded-xl bg-surface-container border border-outline"
            >
              <div className="min-w-0 flex-grow">
                <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{s.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                  {s.mode} • {s.difficulty} • {s.question_count} questions
                  {s.time_limit_min ? ` • ${s.time_limit_min} min` : ''}
                </p>
                {s.last_total > 0 && (
                  <p className="font-label-sm text-label-sm text-primary">
                    Last score: {s.last_score}/{s.last_total}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                aria-label="Delete set"
                className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

function Quiz({ setId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const startedAt = useRef(Date.now())
  const submitRef = useRef(null)
  const timed = remaining !== null

  useEffect(() => {
    studyApi
      .getSet(setId)
      .then((res) => {
        setData(res)
        startedAt.current = Date.now()
        if (res.set.time_limit_min) setRemaining(res.set.time_limit_min * 60)
      })
      .catch((err) => setError(err.message || 'Could not load this question set.'))
      .finally(() => setLoading(false))
  }, [setId])

  const handleSubmit = async () => {
    if (submitting || result) return
    setSubmitting(true)
    setError('')
    try {
      const res = await studyApi.submitAttempt(setId, answers, Math.round((Date.now() - startedAt.current) / 1000))
      setResult(res)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err.message || 'Could not submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    submitRef.current = handleSubmit
  })

  useEffect(() => {
    if (!timed || result) return undefined
    const id = setInterval(() => setRemaining((prev) => (prev === null ? prev : Math.max(prev - 1, 0))), 1000)
    return () => clearInterval(id)
  }, [timed, result])

  useEffect(() => {
    if (remaining === 0 && !result) submitRef.current?.()
  }, [remaining, result])

  const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))

  return (
    <div className={SHELL}>
      <TopAppBar title={result ? 'Results' : 'Questions'} showBack />
      <main className={MAIN}>
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}
        {loading && <LibraryLoader size={120} fullScreen />}

        {data && !result && (
          <>
            <div className="flex items-start justify-between gap-3 mb-stack-md">
              <div className="min-w-0">
                <h1 className="font-headline-md text-headline-md font-display text-on-surface">{data.set.title}</h1>
                <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                  {data.set.mode} • {data.set.difficulty} • {data.questions.length} questions
                </p>
              </div>
              {timed && (
                <div className={`flex-none px-3 py-1.5 rounded-full font-label-md text-label-md font-semibold ${remaining <= 60 ? 'bg-error/15 text-error' : 'bg-surface-container border border-outline text-on-surface'}`}>
                  {formatClock(remaining)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-stack-md">
              {data.questions.map((q) => (
                <div key={q.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                  <p className="font-body-md text-body-md font-semibold text-on-surface mb-3">
                    {q.position}. {q.prompt}
                  </p>
                  {q.kind === 'mcq' ? (
                    <div className="flex flex-col gap-2">
                      {(q.options || []).map((opt, i) => {
                        const letter = String.fromCharCode(65 + i)
                        const picked = answers[q.id] === letter
                        return (
                          <button
                            key={letter}
                            onClick={() => setAnswer(q.id, letter)}
                            className={`text-left px-3 py-2.5 rounded-lg border font-body-md text-body-md transition-colors ${
                              picked ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline text-on-surface'
                            }`}
                          >
                            <span className="font-semibold mr-2">{letter}.</span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={q.kind === 'theory' ? 6 : 3}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      maxLength={2000}
                      placeholder="Type your answer…"
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-y"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full mt-stack-lg py-4 rounded-lg bg-primary text-on-primary font-headline-md text-headline-md ${submitting ? 'opacity-60' : 'active:scale-[0.98]'}`}
            >
              {submitting ? 'Marking…' : 'Submit'}
            </button>
          </>
        )}

        {result && (
          <>
            <div className="p-stack-lg rounded-xl bg-surface-container border border-outline text-center mb-stack-lg">
              {result.total > 0 ? (
                <>
                  <p className="font-display text-4xl text-on-surface">{result.score}/{result.total}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                    {Math.round((result.score / result.total) * 100)}% on multiple choice
                  </p>
                </>
              ) : (
                <p className="font-body-md text-body-md text-on-surface">No multiple choice questions to score.</p>
              )}
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                Short and theory answers are not scored. Compare yours with the model answer.
              </p>
            </div>

            <div className="flex flex-col gap-stack-md">
              {result.results.map((q) => (
                <div
                  key={q.id}
                  className={`p-stack-md rounded-xl border ${
                    q.correct === true ? 'bg-emerald-500/10 border-emerald-500/40'
                    : q.correct === false ? 'bg-error/10 border-error/30'
                    : 'bg-surface-container border-outline'
                  }`}
                >
                  <p className="font-body-md text-body-md font-semibold text-on-surface mb-2">
                    {q.position}. {q.prompt}
                  </p>
                  {q.kind === 'mcq' ? (
                    <>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        Your answer: {q.yourAnswer ? `${q.yourAnswer}. ${(q.options || [])[q.yourAnswer.charCodeAt(0) - 65] || ''}` : 'Not answered'}
                      </p>
                      <p className="font-label-md text-label-md text-on-surface">
                        Correct: {q.answer}. {(q.options || [])[q.answer.charCodeAt(0) - 65]}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-label-md text-label-md text-on-surface-variant whitespace-pre-wrap">
                        Your answer: {q.yourAnswer || 'Not answered'}
                      </p>
                      <p className="font-label-md text-label-md text-on-surface mt-1 whitespace-pre-wrap">Model answer: {q.answer}</p>
                    </>
                  )}
                  {q.explanation && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            <Link
              to="/reading-space/practice"
              className="block text-center mt-stack-lg py-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md"
            >
              Back to my question sets
            </Link>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

function StudyPractice() {
  const { setId } = useParams()
  return setId ? <Quiz key={setId} setId={setId} /> : <SetList />
}

export default StudyPractice