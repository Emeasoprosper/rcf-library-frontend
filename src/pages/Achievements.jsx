// pages/Achievements.jsx
// Streak, weekly reading goal (editable) and every badge with progress.
import { useEffect, useState } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { engagementApi } from '../services/api'
import { StreakCard, GoalRing, BadgeTile } from '../components/ui/Engagement'

const GOAL_OPTIONS = [3, 5, 7, 10, 15, 20]

function Achievements() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    engagementApi.me().then(setData).catch((err) => setError(err.message || 'Could not load your progress.'))
  }, [])

  const setGoal = async (goal) => {
    setSaving(true)
    setError('')
    try {
      setData(await engagementApi.setGoal(goal))
    } catch (err) {
      setError(err.message || 'Could not save your goal.')
    } finally {
      setSaving(false)
    }
  }

  const earned = data?.badges.filter((b) => b.earned).length || 0

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Achievements" showBack />

      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile flex flex-col gap-stack-lg">
        <div className="mt-stack-md">
          <h1 className="font-display text-[34px] md:text-[44px] leading-[1.05] font-extrabold tracking-tight">Your progress</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {data ? `${earned} of ${data.badges.length} badges earned. Keep reading to unlock the rest!` : error || 'Loading…'}
          </p>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StreakCard streak={data.streak} week={data.week} />
              <div className="rounded-[22px] p-4 bg-surface-container border border-outline">
                <div className="flex items-center gap-3">
                  <div className="relative text-on-surface">
                    <GoalRing done={data.week.done} goal={data.week.goal} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-[22px] font-extrabold leading-none">{data.week.done}</span>
                      <span className="text-[10px] text-on-surface-variant">of {data.week.goal}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-semibold">Weekly goal</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Different resources opened, Monday to Sunday.</p>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-3 mb-2">Set your goal</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={saving}
                      onClick={() => setGoal(g)}
                      className={`rcf-press h-10 rounded-xl font-label-md text-label-md border transition-colors disabled:opacity-60 ${
                        data.week.goal === g ? 'bg-gradient-to-br from-[#4caf50] to-[#38bdf8] text-white border-transparent shadow-md' : 'bg-surface-container-low border-outline text-on-surface'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Best streak', value: `${data.streak.best}d`, icon: 'local_fire_department', tone: 'text-orange-500' },
                { label: 'Resources read', value: data.totals.distinctResources, icon: 'menu_book', tone: 'text-blue-500' },
                { label: 'Uploads', value: data.totals.uploads, icon: 'volunteer_activism', tone: 'text-pink-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-3 bg-surface-container border border-outline flex flex-col items-center text-center">
                  <span className={`material-symbols-outlined ${s.tone}`}>{s.icon}</span>
                  <span className="font-display text-[22px] font-extrabold leading-tight mt-1">{s.value}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{s.label}</span>
                </div>
              ))}
            </div>

            <section>
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-[22px] p-4 bg-surface-container border border-outline">
                {[...data.badges].sort((a, b) => Number(b.earned) - Number(a.earned)).map((b) => (
                  <BadgeTile key={b.key} badge={b} size="lg" />
                ))}
              </div>
            </section>
          </>
        )}
        {error && data && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      </main>

      <BottomNav />
    </div>
  )
}

export default Achievements
