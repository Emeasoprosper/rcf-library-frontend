// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/Engagement.jsx
// Streak, weekly goal ring, verse/tip of the day, badges and the "new badge"
// celebration. Data comes from GET /api/engagement/me.
import { useEffect, useRef, useState } from 'react'
import { Heart, Share2, Share, X } from 'lucide-react'
import { shareQuoteCard, isLiked, setLiked } from '../../lib/shareQuote'
import { useFitCard } from '../../lib/fitText'
import { loadPath, TYPES } from '../../lib/readingPath'
import { Link } from 'react-router-dom'
import { engagementApi } from '../../services/api'
import { verseOfTheDay, tipOfTheDay } from '../../lib/dailyInspiration'
import { Confetti } from './Celebrate'
import { Medal, AnimatedFlame } from './Illustrations'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const SEEN_KEY = 'rcf_badges_seen'

export function GoalRing({ done, goal, size = 92, className = '' }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const target = goal > 0 ? Math.min(done / goal, 1) : 0
  // Start empty and fill up after the first paint, so the ring visibly grows.
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setPct(target))
    return () => cancelAnimationFrame(id)
  }, [target])
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`flex-none -rotate-90 ${className}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeOpacity="0.15" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#rcfGoalGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1)' }}
      />
      <defs>
        <linearGradient id="rcfGoalGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4caf50" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function BadgeTile({ badge, size = 'md' }) {
  const big = size === 'lg'
  return (
    <div className={`flex flex-col items-center text-center gap-1.5 ${big ? 'w-full' : 'w-[76px] flex-none'}`} title={badge.desc}>
      <div className={badge.earned ? 'drop-shadow-md' : ''}>
        <Medal badge={badge} size={big ? 68 : 50} />
      </div>
      <p className={`font-label-sm text-label-sm leading-tight ${badge.earned ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{badge.title}</p>
      {big && (
        <>
          <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight">{badge.desc}</p>
          {!badge.earned && badge.target > 1 && (
            <div className="w-full max-w-[120px]">
              <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#4caf50] to-[#38bdf8]" style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">{badge.progress} / {badge.target}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function StreakCard({ streak, week }) {
  const alive = streak.current > 0
  return (
    <div className="rcf-lift relative overflow-hidden rounded-[22px] p-4 bg-gradient-to-br from-[#3a1d14] via-[#5a2617] to-[#7a2f16] text-white border border-orange-900/40">
      <span className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-orange-400/15 blur-2xl" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <AnimatedFlame size={42} lit={alive || streak.readToday} />
        <div>
          <p className="font-display text-[30px] font-extrabold leading-none">{streak.current}</p>
          <p className="text-[12px] font-semibold text-white/90">day streak</p>
        </div>
      </div>
      <div className="flex justify-between mt-3">
        {week.days.map((d, i) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                d.read ? 'bg-gradient-to-b from-[#FFD84D] to-[#FF7A1F] text-[#3a1d14]' : d.today ? 'border-2 border-orange-300/90' : 'bg-white/12'
              } ${d.future ? 'opacity-50' : ''}`}
            >
              {d.read ? '✓' : ''}
            </span>
            <span className="text-[10px] text-white/80">{DAY_LETTERS[i]}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-white/90 mt-2">
        {streak.readToday
          ? `Nice! Today counts. Best: ${streak.best} day${streak.best === 1 ? '' : 's'}.`
          : alive
            ? 'Open any resource today to keep your streak alive 🔥'
            : 'Open any resource today to start a streak.'}
      </p>
    </div>
  )
}

// Small rounded action used inside cards ("See all", "Adjust goal") instead
// of a bare "text →". Rendered as a span because the whole card is the link.
function CardAction({ icon = 'chevron_right', iconFirst = false, children }) {
  const glyph = <span className="material-symbols-outlined text-[17px] leading-none">{icon}</span>
  return (
    <span className={`inline-flex items-center gap-1 h-7 rounded-full bg-primary/10 text-primary text-[12px] font-semibold tracking-wide transition-colors group-hover:bg-primary/20 ${iconFirst ? 'pl-2 pr-3' : 'pl-3 pr-1.5'}`}>
      {iconFirst && glyph}
      {children}
      {!iconFirst && glyph}
    </span>
  )
}

const GOAL_CELEBRATED_KEY = 'rcf_goal_celebrated_week'

// True the first time this device sees the goal reached in a given week.
function firstTimeGoalHit(hit, weekKey) {
  if (!hit || !weekKey) return false
  try {
    if (localStorage.getItem(GOAL_CELEBRATED_KEY) === weekKey) return false
    localStorage.setItem(GOAL_CELEBRATED_KEY, weekKey)
  } catch { /* storage blocked: celebrate anyway */ }
  return true
}

export function WeeklyGoalCard({ week }) {
  const hit = week.goal > 0 && week.done >= week.goal
  const [celebrate] = useState(() => firstTimeGoalHit(hit, week.days?.[0]?.date))
  const left = week.goal - week.done
  return (
    <Link
      to="/achievements"
      className={`group rcf-lift relative overflow-hidden rounded-[22px] p-4 border flex items-center gap-3 ${
        hit ? 'bg-gradient-to-br from-[#4caf50]/15 via-surface-container to-surface-container border-[#4caf50]/40' : 'bg-surface-container border-outline'
      }`}
    >
      {celebrate && <Confetti count={18} />}
      <div className="relative text-on-surface flex-none">
        {hit && celebrate && (
          <>
            <span className="rcf-ring-burst absolute inset-0 rounded-full border-4 border-[#4caf50]" style={{ animationDelay: '0.9s' }} />
            <span className="rcf-ring-burst absolute inset-0 rounded-full border-4 border-[#38bdf8]" style={{ animationDelay: '1.15s' }} />
          </>
        )}
        <GoalRing done={week.done} goal={week.goal} className={hit ? 'rcf-goal-glow' : ''} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hit ? (
            <span className="rcf-pop w-11 h-11 rounded-full bg-gradient-to-br from-[#4caf50] to-[#38bdf8] text-white flex items-center justify-center shadow-lg" style={{ animationDelay: celebrate ? '0.9s' : '0s' }}>
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
            </span>
          ) : (
            <>
              <span className="font-display text-[22px] font-extrabold leading-none">{week.done}</span>
              <span className="text-[10px] text-on-surface-variant">of {week.goal}</span>
            </>
          )}
        </div>
      </div>
      <div className="min-w-0 relative">
        <p className="font-body-md text-body-md font-semibold text-on-surface">{hit ? 'Goal complete! 🎯' : 'Weekly goal'}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {hit
            ? `${week.done} of ${week.goal} resources this week. Well done!`
            : `${left} more resource${left === 1 ? '' : 's'} to go this week`}
        </p>
        <div className="mt-2">
          <CardAction icon="tune" iconFirst>Adjust goal</CardAction>
        </div>
      </div>
    </Link>
  )
}

const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

// Heart + share, as in the reference: red outline heart, blue share.
// round = the popup's big white circles in the order ✕ (onClose) · share · heart.
export function QuoteActions({ id, text, by, cardRef, tone = 'light', round = false, onClose = null }) {
  const [liked, setLikedState] = useState(() => isLiked(id))
  const [pop, setPop] = useState(false)
  const [status, setStatus] = useState('')

  const toggleLike = () => {
    const next = !liked
    setLikedState(next)
    setLiked(id, next)
    if (next) {
      setPop(true)
      setTimeout(() => setPop(false), 1100)
    }
  }

  const share = async () => {
    setStatus('Preparing…')
    const result = await shareQuoteCard(cardRef?.current, { text, by })
    setStatus(result === 'downloaded' ? 'Image saved, caption copied ✓' : '')
    if (result === 'downloaded') setTimeout(() => setStatus(''), 2500)
  }

  const dark = tone === 'navy'
  const base = round
    ? 'w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center rcf-press'
    : 'w-10 h-10 rounded-full flex items-center justify-center rcf-press transition-colors'
  return (
    <div data-html2canvas-ignore className="flex flex-col items-center">
      <div className={`flex items-center ${round ? 'gap-8' : 'gap-8'}`}>
        {round && onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className={base}>
            <X size={28} strokeWidth={2.4} className="text-[#ef4444]" />
          </button>
        )}
        {round && (
          <button type="button" onClick={share} aria-label="Share" className={base}>
            <Share size={24} strokeWidth={2.2} className="text-[#111]" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Love this'}
          className={`${base} relative ${round ? (liked ? 'ring-4 ring-[#22c55e]/25' : '') : dark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          {/* Outline until loved, then filled; a tap bounces it and floats little hearts up. */}
          <Heart
            size={round ? 28 : 24}
            strokeWidth={2.2}
            className={`${round ? 'text-[#22c55e]' : 'text-[#ef4444]'} ${pop ? 'rcf-heart-beat' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
          />
          {pop &&
            [-18, 0, 16].map((hx, i) => (
              <Heart
                key={hx}
                size={round ? 14 : 12}
                className={`rcf-heart-float absolute left-1/2 top-1/2 -ml-[7px] -mt-[7px] pointer-events-none ${round ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
                fill="currentColor"
                style={{ '--hx': `${hx}px`, animationDelay: `${i * 80}ms` }}
              />
            ))}
        </button>
        {!round && (
          <button type="button" onClick={share} aria-label="Share" className={`${base} ${dark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <Share2 size={22} strokeWidth={2} className={dark ? 'text-[#8fb0ff]' : 'text-[#2563eb]'} />
          </button>
        )}
      </div>
      {status && <p className={`mt-1 text-[11px] ${dark ? 'text-white/70' : 'text-[#16235e]/60'}`}>{status}</p>}
      {round && liked && <p className="mt-2 text-[11px] font-semibold text-white/80">💚 You loved this</p>}
    </div>
  )
}

// Square quote card (social-post style): logo, quote, author, heart + share.
// The hidden footer only appears in the shared image, as a link to the site.
// The card never changes shape: long quotes get smaller type (useFitCard).
function QuoteCard({ tone, label, text, by, id }) {
  const navy = tone === 'navy'
  const ref = useRef(null)
  useFitCard(ref, text)
  return (
    <article
      ref={ref}
      className={`rcf-lift relative aspect-square overflow-hidden rounded-[26px] px-5 py-5 md:px-7 md:py-6 flex flex-col items-center text-center shadow-lg ${
        navy ? 'bg-[#16235e] text-white' : 'bg-white text-[#3f3f46] border border-black/5'
      }`}
    >
      <span className={`w-11 h-11 md:w-12 md:h-12 flex-none rounded-full overflow-hidden ring-2 ${navy ? 'ring-white/30 bg-white' : 'ring-black/5 bg-[#16235e]'}`}>
        <img src="/android-chrome-192x192.png" alt="" className="w-full h-full object-cover" />
      </span>
      <p className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${navy ? 'text-white/55' : 'text-[#16235e]/50'}`}>{label}</p>
      <div data-fit-region className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        <p data-fit-text className={`leading-snug break-words ${navy ? 'text-white/90' : 'text-[#52525b]'}`}>{text}</p>
      </div>
      <p className={`text-[11px] md:text-[12px] font-bold uppercase tracking-[0.12em] ${navy ? 'text-white' : 'text-[#16235e]'}`}>{by}</p>
      <div className="mt-2">
        <QuoteActions id={id} text={text} by={by} cardRef={ref} tone={tone} />
      </div>
      <p data-share-footer className={`hidden mt-3 text-[11px] font-semibold ${navy ? 'text-white/75' : 'text-[#16235e]/70'}`}>
        Daily verses & study tips · rcf-mouau-library.vercel.app
      </p>
    </article>
  )
}

// Mobile: swipeable row of full squares (the next one peeks in).
// Desktop: two squares side by side.
export function DailyQuotes() {
  const v = verseOfTheDay()
  const t = tipOfTheDay()
  const day = lagosToday()
  return (
    <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-1">
      <div className="snap-center flex-none w-[84%] sm:w-[60%] md:w-auto">
        <QuoteCard tone="navy" label="Verse of the day" text={v.text} by={v.ref} id={`${day}-verse`} />
      </div>
      <div className="snap-center flex-none w-[84%] sm:w-[60%] md:w-auto">
        <QuoteCard tone="light" label="Study tip of the day" text={t.text} by="RCF Library" id={`${day}-tip`} />
      </div>
    </div>
  )
}

// Badges earned that this device hasn't celebrated yet. The very first load
// just remembers what's already earned, so nobody gets a flood of old badges.
function takeNewBadges(badges) {
  const earned = badges.filter((b) => b.earned).map((b) => b.key)
  let seen = null
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null') } catch { /* storage blocked */ }
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(earned)) } catch { /* storage blocked */ }
  if (!Array.isArray(seen)) return []
  return badges.filter((b) => b.earned && !seen.includes(b.key))
}

export function BadgeUnlocked({ badges, onClose }) {
  const b = badges[0]
  return (
    <div role="dialog" aria-modal="true" aria-label="New badge" className="fixed inset-0 z-[260] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm overflow-hidden" onClick={onClose}>
      <Confetti count={22} />
      <div className="rcf-pop relative w-full max-w-sm rounded-[32px] bg-surface-container border border-outline shadow-2xl p-8 flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-amber-500">New badge unlocked!</p>
        <div className="rcf-float mt-4 drop-shadow-2xl">
          <Medal badge={b} size={110} />
        </div>
        <h2 className="font-display text-[30px] font-extrabold text-on-surface mt-5">{b.title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{b.desc}</p>
        {badges.length > 1 && <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">+{badges.length - 1} more badge{badges.length > 2 ? 's' : ''}</p>}
        <button onClick={onClose} className="rcf-press mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-label-md text-label-md font-semibold shadow-lg">
          Awesome! 🎉
        </button>
      </div>
    </div>
  )
}

// Home entry to /reading-path: invites the quiz, or shows their reader type.
function ReadingPathCard() {
  const path = loadPath()
  const type = path && TYPES.find((t) => t.key === path.type)
  return (
    <Link
      to="/reading-path"
      className={`group rcf-lift relative overflow-hidden rounded-[22px] p-4 flex items-center gap-4 text-white bg-gradient-to-br ${type ? type.gradient : 'from-[#5b7cfa] to-[#8b5cf6]'} shadow-lg`}
    >
      <span className="absolute -right-8 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <span className="flex-none w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-[26px]">
        {type ? type.emoji : <span className="material-symbols-outlined text-[26px]">explore</span>}
      </span>
      <div className="min-w-0 flex-1 relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">My Reading Path</p>
        <p className="font-body-md text-body-md font-semibold leading-snug">
          {type ? `${type.title}: your shelves are ready` : 'What should you read next?'}
        </p>
        <p className="font-label-sm text-label-sm text-white/80">
          {type ? 'Books picked for your goals and the way you read.' : '5 quick questions, then a plan made for you.'}
        </p>
      </div>
      <span className="relative flex-none w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
        <span className="material-symbols-outlined text-[22px]">chevron_right</span>
      </span>
    </Link>
  )
}

// Everything for the home page: streak + goal, verse, tip, badge strip.
export function HomeEngagement() {
  const [data, setData] = useState(null)
  const [fresh, setFresh] = useState([])
  const clearFresh = () => setFresh([])

  useEffect(() => {
    engagementApi
      .me()
      .then((res) => {
        setData(res)
        setFresh(takeNewBadges(res.badges))
      })
      .catch(() => {})
  }, [])

  const earned = data?.badges.filter((b) => b.earned) || []
  const next = data?.badges.filter((b) => !b.earned).slice(0, 3) || []

  return (
    <section className="px-margin-mobile mb-stack-lg flex flex-col gap-3">
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StreakCard streak={data.streak} week={data.week} />
          <WeeklyGoalCard week={data.week} />
        </div>
      )}
      <ReadingPathCard />
      <DailyQuotes />
      {data && (
        <Link to="/achievements" className="group rcf-lift rounded-[22px] p-4 bg-surface-container border border-outline block">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              Badges <span className="text-on-surface-variant font-normal">· {earned.length} of {data.badges.length}</span>
            </p>
            <CardAction>See all</CardAction>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[...earned, ...next].map((b) => <BadgeTile key={b.key} badge={b} />)}
          </div>
        </Link>
      )}
      {fresh.length > 0 && <BadgeUnlocked badges={fresh} onClose={clearFresh} />}
    </section>
  )
}
