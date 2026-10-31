// pages/ReadingPath.jsx
// "My Reading Path": a five-question library questionnaire (goals, reader
// type, how they learn, daily time, optional topic) -> a stamped reader
// card, a ruled reading log for the week and shelves of real library items.
// Styled like printed library stationery on purpose: serif questions,
// lettered answers, paper card, brass accent. Saved on this device.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import { resourcesApi, engagementApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { GOALS, TYPES, STYLES, TIMES, loadPath, savePath, clearPath, weeklyPlan, buildShelves } from '../lib/readingPath'

const EMPTY = { goals: [], type: '', styles: [], time: '', topic: '' }
const STEPS = ['goals', 'type', 'styles', 'time', 'topic']
const LETTERS = 'ABCDEF'
const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" }
// Brass: a warm library accent that reads on both the dark and light theme.
const BRASS = '#d9a441'
const INK = '#2a2118'
const PAPER = '#f3ead8'
const STAMP = '#a8352b'

function Answers({ options, isSelected, onPick, quoteHints = false }) {
  return (
    <ol className="rounded-2xl border border-outline overflow-hidden divide-y divide-outline">
      {options.map((o, i) => {
        const on = isSelected(o.key)
        return (
          <li key={o.key}>
            <button
              type="button"
              onClick={() => onPick(o.key)}
              aria-pressed={on}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-container"
              style={on ? { background: `${BRASS}1f` } : undefined}
            >
              <span
                className="flex-none w-8 h-8 rounded-full border flex items-center justify-center text-[13px] font-semibold transition-colors"
                style={on ? { background: BRASS, borderColor: BRASS, color: INK } : { borderColor: 'var(--color-outline)' }}
              >
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body-md text-body-md font-semibold text-on-surface">{o.title}</span>
                <span className={`block text-[13px] text-on-surface-variant mt-0.5 ${quoteHints ? 'italic' : ''}`} style={quoteHints ? SERIF : undefined}>
                  {quoteHints ? `“${o.hint}”` : o.hint}
                </span>
              </span>
              <span className={`material-symbols-outlined text-[20px] transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} style={{ color: BRASS }}>
                check
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Questionnaire({ initial, onDone, firstName }) {
  const [step, setStep] = useState(0)
  const [a, setA] = useState(initial || EMPTY)
  const name = STEPS[step]

  const toggle = (field, key, max) =>
    setA((prev) => {
      if (prev[field].includes(key)) return { ...prev, [field]: prev[field].filter((k) => k !== key) }
      return { ...prev, [field]: [...prev[field], key].slice(-max) }
    })

  const canNext =
    (name === 'goals' && a.goals.length > 0) ||
    (name === 'type' && a.type) ||
    (name === 'styles' && a.styles.length > 0) ||
    (name === 'time' && a.time) ||
    name === 'topic'

  const [question, hint] = {
    goals: [`What are you reading for${firstName ? `, ${firstName}` : ''}?`, 'Choose up to three.'],
    type: ['Which of these sounds most like you?', 'Choose one. There is no wrong answer.'],
    styles: ['How do you like to learn?', 'Choose all that apply.'],
    time: ['How much time can you give each day?', 'Small and steady beats big and rare.'],
    topic: ['Is there a course or topic on your mind?', 'Optional. For example: Biochemistry, GST 101, public speaking.'],
  }[name]

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant whitespace-nowrap">
          Question {step + 1} of {STEPS.length}
        </span>
        <span className="flex-1 flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className="h-[3px] flex-1 rounded-full transition-colors duration-300" style={{ background: i <= step ? BRASS : 'var(--color-outline)' }} />
          ))}
        </span>
      </div>

      <div key={name} className="rcf-step flex flex-col gap-5">
        <div>
          <h2 className="text-[28px] md:text-[36px] leading-[1.12] font-bold text-on-surface" style={SERIF}>{question}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{hint}</p>
        </div>

        {name === 'goals' && <Answers options={GOALS} isSelected={(k) => a.goals.includes(k)} onPick={(k) => toggle('goals', k, 3)} />}
        {name === 'type' && (
          <Answers options={TYPES.map((t) => ({ key: t.key, title: t.title, hint: t.line }))} quoteHints isSelected={(k) => a.type === k} onPick={(k) => setA({ ...a, type: k })} />
        )}
        {name === 'styles' && <Answers options={STYLES} isSelected={(k) => a.styles.includes(k)} onPick={(k) => toggle('styles', k, 4)} />}
        {name === 'time' && <Answers options={TIMES} isSelected={(k) => a.time === k} onPick={(k) => setA({ ...a, time: k })} />}
        {name === 'topic' && (
          <input
            value={a.topic}
            onChange={(e) => setA({ ...a, topic: e.target.value.slice(0, 40) })}
            placeholder="Write it here"
            className="h-14 bg-transparent border-0 border-b-2 border-outline px-1 text-[22px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            style={{ ...SERIF, borderBottomColor: a.topic ? BRASS : undefined }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="h-12 px-5 rounded-full border border-outline text-on-surface font-label-lg text-label-lg">
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => (step === STEPS.length - 1 ? onDone(a) : setStep(step + 1))}
          disabled={!canNext}
          className="rcf-press flex-1 h-12 rounded-full font-label-lg text-label-lg font-semibold transition-colors disabled:cursor-not-allowed"
          style={canNext ? { background: BRASS, color: INK } : { border: '1px solid var(--color-outline)', color: 'var(--color-on-surface-variant)' }}
        >
          {step === STEPS.length - 1 ? (a.topic ? 'Issue my reader card' : 'Skip and issue my card') : 'Next question'}
        </button>
      </div>
    </section>
  )
}

// The result, as a library reader card: paper, ruled lines, hole punch, a
// rubber stamp with the reader type, and a librarian's note.
function ReaderCard({ type, name, issued }) {
  return (
    <article
      className="rcf-pop relative overflow-hidden rounded-md shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)]"
      style={{
        background: `${PAPER} repeating-linear-gradient(to bottom, transparent 0 31px, rgba(42,33,24,0.10) 31px 32px)`,
        color: INK,
      }}
    >
      <span className="absolute left-4 top-4 w-3.5 h-3.5 rounded-full bg-background" aria-hidden="true" />
      <header className="flex items-end justify-between gap-3 px-6 pl-12 pt-4 pb-2 border-b-2" style={{ borderColor: INK }}>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em]">RCF MOUAU Library</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">Reader card</span>
      </header>

      <div className="relative px-6 pt-5 pb-6">
        <span
          className="absolute right-4 top-4 px-3 py-1 border-[3px] rounded-md text-[12px] font-extrabold uppercase tracking-[0.14em] rotate-[-9deg] opacity-80 select-none"
          style={{ borderColor: STAMP, color: STAMP, mixBlendMode: 'multiply' }}
          aria-hidden="true"
        >
          {type.title.replace(/^The /, '')}
        </span>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px] max-w-[70%]">
          <dt className="uppercase tracking-wider opacity-60 text-[11px] pt-0.5">Reader</dt>
          <dd className="font-semibold truncate">{name || 'RCF member'}</dd>
          <dt className="uppercase tracking-wider opacity-60 text-[11px] pt-0.5">Issued</dt>
          <dd className="font-semibold">{issued}</dd>
        </dl>

        <p className="mt-6 text-[11px] uppercase tracking-[0.2em] opacity-60">Reader type</p>
        <h2 className="text-[34px] md:text-[42px] leading-none font-bold mt-1" style={SERIF}>{type.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed max-w-xl" style={SERIF}>{type.about}</p>
        <p className="mt-3 text-[13px]">
          <span className="uppercase tracking-wider opacity-60 text-[11px] mr-2">Strengths</span>
          <span className="font-semibold">{type.strengths.join(' · ')}</span>
        </p>

        <div className="mt-5 pt-4 border-t border-dashed" style={{ borderColor: 'rgba(42,33,24,0.35)' }}>
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">Librarian's note</p>
          <p className="mt-1 text-[16px] italic leading-snug" style={SERIF}>{type.tip}</p>
        </div>
      </div>
    </article>
  )
}

function ReadingLog({ answers }) {
  const time = TIMES.find((t) => t.key === answers.time) || TIMES[0]
  const plan = weeklyPlan(answers)
  const [msg, setMsg] = useState('')

  const applyGoal = async () => {
    setMsg('Saving…')
    try {
      await engagementApi.setGoal(time.weekly)
      setMsg(`Done. Your weekly goal is now ${time.weekly}.`)
    } catch {
      setMsg('Could not save. You can set it on the Achievements page.')
    }
  }

  return (
    <section className="rounded-2xl border border-outline overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[22px] font-bold text-on-surface" style={SERIF}>Your reading log</h3>
          <p className="text-[13px] text-on-surface-variant">{time.minutes} minutes a day. Sunday is lighter.</p>
        </div>
        <button type="button" onClick={applyGoal} className="text-[13px] font-semibold underline underline-offset-4" style={{ color: BRASS }}>
          Use {time.weekly} a week as my goal
        </button>
      </header>
      {msg && <p className="px-4 pb-2 text-[12px] text-on-surface-variant">{msg}</p>}
      <table className="w-full text-left">
        <tbody className="divide-y divide-outline border-t border-outline">
          {plan.map((d, i) => (
            <tr key={d.day} className={i === 6 ? 'bg-surface-container/60' : ''}>
              <td className="pl-4 py-3 w-[34%] text-[14px] font-semibold text-on-surface">{d.day}</td>
              <td className="py-3 text-[14px] text-on-surface">
                {d.focus}
                <span className="text-on-surface-variant"> · {d.how}</span>
              </td>
              <td className="pr-4 py-3 text-right text-[13px] tabular-nums text-on-surface-variant whitespace-nowrap">{d.minutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Result({ answers, onRetake, name }) {
  const navigate = useNavigate()
  const type = TYPES.find((t) => t.key === answers.type) || TYPES[0]
  const issued = new Date(answers.at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const [shelves, setShelves] = useState(null)

  useEffect(() => {
    let cancelled = false
    buildShelves(answers, (params) => resourcesApi.list(params))
      .then((s) => { if (!cancelled) setShelves(s) })
      .catch(() => { if (!cancelled) setShelves([]) })
    return () => { cancelled = true }
  }, [answers])

  const toItem = (r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.author || r.category || '',
    thumbnailUrl: r.thumbnail_url,
    thumbnailStatus: r.thumbnail_status,
    fileType: r.file_type,
    onClick: () => navigate(`/library/${r.id}`),
  })

  return (
    <section className="flex flex-col gap-8">
      <ReaderCard type={type} name={name} issued={issued} />
      <ReadingLog answers={answers} />

      <div className="flex flex-col gap-5">
        <div className="border-b border-outline pb-3">
          <h3 className="text-[26px] font-bold text-on-surface" style={SERIF}>On your shelf</h3>
          <p className="text-[13px] text-on-surface-variant">Chosen from the RCF library for your goals and the way you learn.</p>
        </div>

        {shelves === null && (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((j) => <div key={j} className="flex-none w-32 h-44 rounded-xl bg-surface-container animate-pulse" />)}
          </div>
        )}

        {shelves?.map(({ goal, items }) => (
          <div key={goal.key}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: BRASS }}>
              {goal.shelf}
              {items.length > 0 && <span className="text-on-surface-variant font-normal"> · {items.length}</span>}
            </p>
            {items.length > 0 ? (
              <div className="-mx-margin-mobile">
                <HorizontalRail items={items.map(toItem)} />
              </div>
            ) : (
              <p className="text-[14px] text-on-surface-variant pb-2">
                Nothing on this shelf yet.{' '}
                <Link to={`/search?q=${encodeURIComponent(goal.search[0])}`} className="font-semibold underline underline-offset-4" style={{ color: BRASS }}>
                  Search free books
                </Link>{' '}
                or{' '}
                <Link to="/contribute/request" className="font-semibold underline underline-offset-4" style={{ color: BRASS }}>
                  request one
                </Link>
                .
              </p>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={onRetake} className="self-start text-[13px] font-semibold text-on-surface-variant underline underline-offset-4">
        Answer the questions again
      </button>
    </section>
  )
}

function ReadingPath() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState(loadPath)
  const [retaking, setRetaking] = useState(false)
  const fullName = user?.name || ''
  const showResult = answers && !retaking

  const finish = (a) => {
    const saved = { ...a, at: Date.now() }
    savePath(saved)
    setAnswers(saved)
    setRetaking(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="My Reading Path" showBack />
      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-2xl md:mx-auto px-margin-mobile flex flex-col gap-8">
        <div className="mt-stack-md">
          <h1 className="text-[36px] md:text-[46px] leading-[1.05] font-bold tracking-tight" style={SERIF}>
            {showResult ? 'Your reading path' : 'Find your reading path'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-lg">
            {showResult
              ? 'Your reader card, a plan for the week, and books picked for you.'
              : 'Five short questions. We will issue your reader card and pick books from the library for you.'}
          </p>
        </div>

        {showResult ? (
          <Result
            answers={answers}
            name={fullName}
            onRetake={() => {
              clearPath()
              setRetaking(true)
            }}
          />
        ) : (
          <Questionnaire initial={retaking ? null : answers} onDone={finish} firstName={fullName.split(' ')[0]} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}

export default ReadingPath
