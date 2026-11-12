// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminBirthdays.jsx
// Every member's birthday, month by month: January → their photo, name and
// the day; February → … Today's celebrants are highlighted, and the list
// opens on the current month. Only members who entered a birthday appear.
import { useEffect, useMemo, useState } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function lagosToday() {
  const [, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }).split('-').map(Number)
  return { month: m, day: d }
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

// Days from today until this birthday comes round again (0 = today).
function daysUntil(month, day, today) {
  const year = new Date().getFullYear()
  const start = Date.UTC(year, today.month - 1, today.day)
  let next = Date.UTC(year, month - 1, day)
  if (next < start) next = Date.UTC(year + 1, month - 1, day)
  return Math.round((next - start) / 86400000)
}

function Avatar({ person }) {
  const initial = String(person.name || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="w-11 h-11 flex-none rounded-full p-[2px] bg-gradient-to-br from-pink-500 to-orange-400">
      <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <span className="font-body-md font-bold text-on-surface">{initial}</span>
        )}
      </div>
    </div>
  )
}

function AdminBirthdays() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 1..12
  const [today] = useState(lagosToday)

  useEffect(() => {
    adminApi
      .birthdays()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err.message || 'Could not load birthdays.'))
      .finally(() => setLoading(false))
  }, [])

  const byMonth = useMemo(() => {
    const groups = MONTHS.map(() => [])
    for (const p of items) groups[p.month - 1]?.push(p)
    return groups
  }, [items])

  // Current month first, then the rest of the year in order, wrapping round.
  const monthOrder = useMemo(() => Array.from({ length: 12 }, (_, i) => ((today.month - 1 + i) % 12) + 1), [today.month])
  const shown = filter === 'all' ? monthOrder : [filter]
  const todayCount = byMonth[today.month - 1].filter((p) => p.day === today.day).length

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Birthdays" showBack />

      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-5xl md:mx-auto px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
          {items.length} member{items.length === 1 ? ' has' : 's have'} added a birthday.
          {todayCount > 0 ? ` 🎂 ${todayCount} celebrating today!` : ''}
        </p>

        {/* Month chips: All, then Jan–Dec with how many in each */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-stack-md -mx-margin-mobile px-margin-mobile [scrollbar-width:none]">
          <button
            onClick={() => setFilter('all')}
            className={`flex-none px-3.5 h-9 rounded-full font-label-md text-label-md border transition-colors ${filter === 'all' ? 'bg-primary text-on-primary border-primary' : 'border-outline text-on-surface-variant'}`}
          >
            All
          </button>
          {MONTHS.map((name, i) => {
            const count = byMonth[i].length
            const active = filter === i + 1
            return (
              <button
                key={name}
                onClick={() => setFilter(i + 1)}
                className={`flex-none px-3.5 h-9 rounded-full font-label-md text-label-md border transition-colors flex items-center gap-1.5 ${
                  active ? 'bg-primary text-on-primary border-primary' : i + 1 === today.month ? 'border-pink-500/60 text-on-surface' : 'border-outline text-on-surface-variant'
                }`}
              >
                {name.slice(0, 3)}
                {count > 0 && <span className={`text-[11px] ${active ? 'opacity-80' : 'text-pink-400'}`}>{count}</span>}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && !error && (
          <div className="flex flex-col gap-stack-lg">
            {shown.map((month) => {
              const people = byMonth[month - 1]
              const isThisMonth = month === today.month
              if (filter === 'all' && people.length === 0) return null
              return (
                <section key={month}>
                  <h2 className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
                    {MONTHS[month - 1]}
                    <span className="normal-case tracking-normal text-on-surface-variant/70">· {people.length}</span>
                    {isThisMonth && <span className="normal-case tracking-normal px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[11px]">This month</span>}
                  </h2>

                  {people.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant py-stack-sm">No birthdays in {MONTHS[month - 1]}.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
                      {people.map((p) => {
                        const isToday = isThisMonth && p.day === today.day
                        const left = daysUntil(p.month, p.day, today)
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              isToday ? 'bg-gradient-to-r from-pink-500/15 to-orange-400/10 border-pink-500/50' : 'bg-surface-container border-outline'
                            }`}
                          >
                            <Avatar person={p} />
                            <div className="min-w-0 flex-1">
                              <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{p.name}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">
                                {isToday ? '🎂 Celebrating today' : left <= 7 ? `In ${left} day${left === 1 ? '' : 's'}` : `${MONTHS[p.month - 1]} ${ordinal(p.day)}`}
                                {p.hidden ? ' · hidden from members' : ''}
                              </p>
                            </div>
                            {/* calendar-leaf date */}
                            <div className={`flex-none w-12 rounded-lg overflow-hidden text-center border ${isToday ? 'border-pink-500/60' : 'border-outline'}`}>
                              <div className={`text-[10px] font-bold uppercase py-0.5 text-white ${isToday ? 'bg-pink-500' : 'bg-orange-500'}`}>
                                {MONTHS[p.month - 1].slice(0, 3)}
                              </div>
                              <div className="font-display text-[18px] font-extrabold text-on-surface py-0.5 bg-surface-container-high">{p.day}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
            {filter === 'all' && items.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant">No one has added a birthday yet.</p>
            )}
          </div>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminBirthdays
