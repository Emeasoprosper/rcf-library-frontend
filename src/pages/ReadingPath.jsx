// pages/ReadingPath.jsx
// "My Reading Path": five quick questions (goals, reader type, how they
// learn, daily time, optional topic) -> a reader profile, a weekly rhythm
// and shelves of real library items for each goal. Saved on this device.
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

function OptionCard({ selected, onClick, icon, emoji, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rcf-press relative text-left rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
        selected ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-outline bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      <span className={`flex-none w-11 h-11 rounded-xl flex items-center justify-center text-[22px] ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
        {emoji || <span className="material-symbols-outlined text-[22px]">{icon}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body-md text-body-md font-semibold text-on-surface">{title}</span>
        {hint && <span className="block font-label-sm text-label-sm text-on-surface-variant mt-0.5">{hint}</span>}
      </span>
      {selected && (
        <span className="material-symbols-outlined absolute top-3 right-3 text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
      )}
    </button>
  )
}

function Quiz({ initial, onDone, firstName }) {
  const [step, setStep] = useState(0)
  const [a, setA] = useState(initial || EMPTY)
  const name = STEPS[step]

  const toggle = (field, key, max) =>
    setA((prev) => {
      const has = prev[field].includes(key)
      if (has) return { ...prev, [field]: prev[field].filter((k) => k !== key) }
      return { ...prev, [field]: [...prev[field], key].slice(-max) }
    })

  const canNext =
    (name === 'goals' && a.goals.length > 0) ||
    (name === 'type' && a.type) ||
    (name === 'styles' && a.styles.length > 0) ||
    (name === 'time' && a.time) ||
    name === 'topic'

  const next = () => (step === STEPS.length - 1 ? onDone(a) : setStep(step + 1))

  const heading = {
    goals: [`What are you reading for${firstName ? `, ${firstName}` : ''}?`, 'Pick up to 3. Your shelves are built around these.'],
    type: ['Which sounds most like you?', 'There is no wrong answer. It shapes how we suggest you read.'],
    styles: ['How do you like to learn?', 'Pick all that fit.'],
    time: ['How much time can you give each day?', 'Be honest. Small and steady beats big and rare.'],
    topic: ['Any course or topic on your mind?', 'Optional. e.g. "Biochemistry", "GST 101", "public speaking".'],
  }[name]

  return (
    <section className="flex flex-col gap-stack-md">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Step {step + 1} of {STEPS.length}</span>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="font-label-sm text-label-sm text-primary inline-flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>Back
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#5b7cfa] to-[#8b5cf6] transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div key={name} className="rcf-step flex flex-col gap-stack-md">
        <div>
          <h2 className="font-display text-[26px] md:text-[30px] leading-tight font-extrabold text-on-surface">{heading[0]}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{heading[1]}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {name === 'goals' && GOALS.map((g) => <OptionCard key={g.key} {...g} selected={a.goals.includes(g.key)} onClick={() => toggle('goals', g.key, 3)} />)}
          {name === 'type' && TYPES.map((t) => <OptionCard key={t.key} emoji={t.emoji} title={t.title} hint={t.line} selected={a.type === t.key} onClick={() => setA({ ...a, type: t.key })} />)}
          {name === 'styles' && STYLES.map((s) => <OptionCard key={s.key} {...s} selected={a.styles.includes(s.key)} onClick={() => toggle('styles', s.key, 4)} />)}
          {name === 'time' && TIMES.map((t) => <OptionCard key={t.key} {...t} selected={a.time === t.key} onClick={() => setA({ ...a, time: t.key })} />)}
        </div>

        {name === 'topic' && (
          <input
            value={a.topic}
            onChange={(e) => setA({ ...a, topic: e.target.value.slice(0, 40) })}
            placeholder="Type a course or topic (optional)"
            className="h-12 px-4 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        )}
      </div>

      <button
        type="button"
        onClick={next}
        disabled={!canNext}
        className="rcf-press mt-2 h-13 py-3.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {step === STEPS.length - 1 ? (
          <>
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            {a.topic ? 'Build my reading path' : 'Skip and build my path'}
          </>
        ) : (
          <>
            Continue<span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </>
        )}
      </button>
    </section>
  )
}

function Result({ answers, onRetake }) {
  const navigate = useNavigate()
  const type = TYPES.find((t) => t.key === answers.type) || TYPES[0]
  const time = TIMES.find((t) => t.key === answers.time) || TIMES[0]
  const plan = weeklyPlan(answers)
  const [shelves, setShelves] = useState(null)
  const [goalMsg, setGoalMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    buildShelves(answers, (params) => resourcesApi.list(params))
      .then((s) => { if (!cancelled) setShelves(s) })
      .catch(() => { if (!cancelled) setShelves([]) })
    return () => { cancelled = true }
  }, [answers])

  const applyGoal = async () => {
    setGoalMsg('Saving…')
    try {
      await engagementApi.setGoal(time.weekly)
      setGoalMsg(`Weekly goal set to ${time.weekly} ✓`)
    } catch {
      setGoalMsg('Could not save your goal. Try again from Achievements.')
    }
  }

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
    <section className="flex flex-col gap-stack-lg">
      {/* Reader profile */}
      <div className={`rcf-pop relative overflow-hidden rounded-[28px] p-6 text-white bg-gradient-to-br ${type.gradient} shadow-xl`}>
        <span className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">Your reader type</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[44px] leading-none">{type.emoji}</span>
          <h2 className="font-display text-[30px] md:text-[36px] font-extrabold leading-none">{type.title}</h2>
        </div>
        <p className="mt-3 font-body-md text-body-md text-white/90 max-w-xl">{type.about}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {type.strengths.map((s) => (
            <span key={s} className="px-3 h-7 inline-flex items-center rounded-full bg-white/15 border border-white/20 text-[12px] font-semibold">{s}</span>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-black/15 border border-white/10 p-3 flex gap-2">
          <span className="material-symbols-outlined text-[20px] text-white/90">lightbulb</span>
          <p className="font-label-md text-label-md text-white/90">{type.tip}</p>
        </div>
      </div>

      {/* Weekly rhythm */}
      <div className="rounded-[22px] bg-surface-container border border-outline p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-body-md text-body-md font-semibold text-on-surface">Your weekly rhythm</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{time.minutes} minutes a day, with a lighter Sunday.</p>
          </div>
          <button type="button" onClick={applyGoal} className="rcf-press flex-none inline-flex items-center gap-1 h-8 px-3 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[17px]">flag</span>Set goal: {time.weekly}/week
          </button>
        </div>
        {goalMsg && <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{goalMsg}</p>}
        <div className="grid grid-cols-7 gap-1.5 mt-4">
          {plan.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-container-high py-2.5 px-1">
              <span className="text-[10px] font-semibold uppercase text-on-surface-variant">{d.day}</span>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${d.goal ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-500'}`}>
                <span className="material-symbols-outlined text-[18px]">{d.goal ? d.goal.icon : 'spa'}</span>
              </span>
              <span className="text-[10px] text-on-surface-variant">{d.minutes}m</span>
            </div>
          ))}
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
          Sunday is for rest and reflection: re-read your favourite quote of the week.
        </p>
      </div>

      {/* Shelves */}
      <div className="flex flex-col gap-stack-md">
        <div>
          <h3 className="font-headline-md text-headline-md font-display text-on-surface">Picked for you</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant">From the RCF library, matched to your goals and how you like to learn.</p>
        </div>
        {shelves === null &&
          [0, 1].map((i) => (
            <div key={i} className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((j) => <div key={j} className="flex-none w-32 h-44 rounded-xl bg-surface-container animate-pulse" />)}
            </div>
          ))}
        {shelves?.map(({ goal, items }) =>
          items.length > 0 ? (
            <HorizontalRail key={goal.key} title={goal.shelf} items={items.map(toItem)} />
          ) : (
            <div key={goal.key} className="rounded-2xl border border-dashed border-outline p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">{goal.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-body-md text-body-md font-semibold text-on-surface">{goal.shelf}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Nothing here yet. Search free books or request one.</p>
              </div>
              <Link to={`/search?q=${encodeURIComponent(goal.search[0])}`} className="flex-none inline-flex items-center h-8 px-3 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
                Search
              </Link>
            </div>
          )
        )}
      </div>

      <button type="button" onClick={onRetake} className="self-center inline-flex items-center gap-1 h-10 px-4 rounded-full border border-outline text-on-surface-variant font-label-md text-label-md">
        <span className="material-symbols-outlined text-[18px]">restart_alt</span>Retake the quiz
      </button>
    </section>
  )
}

function ReadingPath() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState(loadPath)
  const [retaking, setRetaking] = useState(false)
  const firstName = (user?.name || '').split(' ')[0]

  const finish = (a) => {
    savePath(a)
    setAnswers(a)
    setRetaking(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="My Reading Path" showBack />
      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile flex flex-col gap-stack-lg">
        <div className="mt-stack-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Personal guide</p>
          <h1 className="font-display text-[34px] md:text-[44px] leading-[1.05] font-extrabold tracking-tight">My Reading Path</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {answers && !retaking ? 'Built around your goals and the way you read.' : 'Answer 5 quick questions and get a reading plan made for you.'}
          </p>
        </div>

        {answers && !retaking ? (
          <Result
            answers={answers}
            onRetake={() => {
              clearPath()
              setRetaking(true)
            }}
          />
        ) : (
          <Quiz initial={retaking ? null : answers} onDone={finish} firstName={firstName} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}

export default ReadingPath
