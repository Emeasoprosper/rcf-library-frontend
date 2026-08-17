import { useState, useEffect } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { communityApi } from '../services/api'

function groupByRecency(items) {
  const today = []
  const yesterday = []
  const earlier = []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  for (const item of items) {
    const date = new Date(item.last_accessed_at)
    if (date >= startOfToday) today.push(item)
    else if (date >= startOfYesterday) yesterday.push(item)
    else earlier.push(item)
  }

  const groups = []
  if (today.length) groups.push({ label: 'Today', items: today })
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday })
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier })
  return groups
}

function ReadingHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    communityApi
      .readingHistory()
      .then(({ items }) => setHistory(items))
      .catch((err) => setError(err.message || 'Could not load reading history.'))
      .finally(() => setLoading(false))
  }, [])

  const groups = groupByRecency(history)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Reading History" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && history.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">history</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing read yet — your reading history will show up here.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <section key={group.label} className="mb-stack-lg">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
              {group.label}
            </h2>
            <div className="flex flex-col gap-gutter">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-stack-sm rounded-xl bg-surface-container border border-outline ${
                    item.completed_at ? 'opacity-60' : ''
                  }`}
                >
                  <div className="w-14 h-20 bg-surface-container-highest rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">menu_book</span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {item.completed_at
                        ? 'Completed'
                        : `${item.author ? `${item.author} • ` : ''}${item.progress_percent}% read`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  )
}

export default ReadingHistory