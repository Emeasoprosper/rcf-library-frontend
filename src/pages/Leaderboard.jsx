import { useState, useEffect } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { communityApi } from '../services/api'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function Leaderboard() {
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    communityApi
      .leaderboard()
      .then(({ items }) => setContributors(items))
      .catch((err) => setError(err.message || 'Could not load the leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Leaderboard" />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
          Ranked by resources contributed and approved.
        </p>

        {loading && <p className="font-body-md text-body-md text-on-surface-variant py-stack-md">Loading…</p>}

        {error && (
          <div className="p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {!loading && !error && contributors.length === 0 && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">emoji_events</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No approved contributions yet — the leaderboard starts with the first one.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {contributors.map((person, index) => (
            <div
              key={person.id}
              className="flex items-center gap-4 p-stack-sm rounded-xl bg-surface-container border border-outline"
            >
              <span className="w-6 text-center font-label-md text-label-md text-on-surface-variant">
                {index + 1}
              </span>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline overflow-hidden flex items-center justify-center font-label-sm text-label-sm text-on-surface">
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  initials(person.name)
                )}
              </div>
              <span className="flex-grow font-body-md text-body-md text-on-surface truncate">{person.name}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">{person.contribution_count}</span>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default Leaderboard
