// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/Engagement.jsx
// Streak, weekly goal ring, verse/tip of the day, badges and the "new badge"
// celebration. Data comes from GET /api/engagement/me.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { engagementApi } from '../../services/api'
import { verseOfTheDay, tipOfTheDay } from '../../lib/dailyInspiration'
import { Confetti } from './Celebrate'

const BADGE_COLORS = {
  blue: 'from-[#4f6cf7] to-[#7c9bff]',
  green: 'from-[#4caf50] to-[#a3d65c]',
  violet: 'from-[#7c5cf5] to-[#b28dff]',
  orange: 'from-[#f97316] to-[#facc15]',
  pink: 'from-[#d946ef] to-[#f472b6]',
  amber: 'from-[#f59e0b] to-[#fde047]',
  teal: 'from-[#0d9488] to-[#38bdf8]',
  slate: 'from-[#475569] to-[#94a3b8]',
}
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const SEEN_KEY = 'rcf_badges_seen'

export function GoalRing({ done, goal, size = 92 }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(done / goal, 1) : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-none -rotate-90" aria-hidden="true">
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
      <div
        className={`relative ${big ? 'w-20 h-20' : 'w-14 h-14'} rounded-2xl flex items-center justify-center ${
          badge.earned ? `bg-gradient-to-br ${BADGE_COLORS[badge.color] || BADGE_COLORS.blue} shadow-lg` : 'bg-surface-container-high'
        }`}
      >
        <span className={`material-symbols-outlined ${big ? 'text-[38px]' : 'text-[28px]'} ${badge.earned ? 'text-white' : 'text-on-surface-variant/50'}`}>
          {badge.earned ? badge.icon : 'lock'}
        </span>
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
    <div className="rcf-lift relative overflow-hidden rounded-[22px] p-4 bg-gradient-to-br from-[#f97316] via-[#fb5c3c] to-[#ec4899] text-white">
      <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-[34px] ${alive ? 'rcf-flicker' : 'opacity-70'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          local_fire_department
        </span>
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
                d.read ? 'bg-white text-[#f05a28]' : d.today ? 'border-2 border-white/90' : 'bg-white/20'
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

export function WeeklyGoalCard({ week }) {
  const hit = week.done >= week.goal
  return (
    <Link to="/achievements" className="rcf-lift rounded-[22px] p-4 bg-surface-container border border-outline flex items-center gap-3">
      <div className="relative text-on-surface">
        <GoalRing done={week.done} goal={week.goal} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[22px] font-extrabold leading-none">{week.done}</span>
          <span className="text-[10px] text-on-surface-variant">of {week.goal}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-body-md text-body-md font-semibold text-on-surface">Weekly goal</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {hit ? 'Goal smashed this week! 🎯' : `${week.goal - week.done} more resource${week.goal - week.done === 1 ? '' : 's'} to go this week`}
        </p>
        <p className="font-label-sm text-label-sm text-primary mt-1">Change goal →</p>
      </div>
    </Link>
  )
}

export function VerseCard() {
  const v = verseOfTheDay()
  return (
    <div className="rcf-lift relative overflow-hidden rounded-[22px] p-5 bg-gradient-to-br from-[#4f6cf7] via-[#6a5cf5] to-[#9b5cf5] text-white">
      <span className="absolute -right-4 -bottom-8 font-display text-[120px] leading-none text-white/10 select-none" aria-hidden="true">”</span>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1">
        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
        Verse of the day
      </p>
      <p className="font-body-md text-[16px] leading-relaxed mt-2">“{v.text}”</p>
      <p className="font-label-md text-label-md font-semibold text-white/90 mt-2">{v.ref}</p>
    </div>
  )
}

export function TipCard() {
  const t = tipOfTheDay()
  return (
    <div className="rcf-lift rounded-[22px] p-4 bg-surface-container border border-outline flex gap-3">
      <span className="w-11 h-11 flex-none rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#38bdf8] flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-[24px]">{t.icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-500">Study tip of the day</p>
        <p className="font-label-md text-label-md text-on-surface mt-1 leading-snug">{t.text}</p>
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
        <div className={`rcf-float mt-4 w-28 h-28 rounded-[30px] bg-gradient-to-br ${BADGE_COLORS[b.color] || BADGE_COLORS.blue} flex items-center justify-center shadow-2xl`}>
          <span className="material-symbols-outlined text-white text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <VerseCard />
        <TipCard />
      </div>
      {data && (
        <Link to="/achievements" className="rcf-lift rounded-[22px] p-4 bg-surface-container border border-outline block">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              Badges <span className="text-on-surface-variant font-normal">· {earned.length} of {data.badges.length}</span>
            </p>
            <span className="font-label-sm text-label-sm text-primary">See all →</span>
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
