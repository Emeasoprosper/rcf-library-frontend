// RCFMOUAULIBRARYreact/student-dashboard/src/pages/HeadsUp.jsx
// New destination for the renamed Contribute tile — a news-feed-style
// list of every current admin announcement/news item.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { newsApi } from '../services/api'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function HeadsUp() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    newsApi
      .latest()
      .then((res) => { if (!cancelled) setItems(res.adminNews || []) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Heads Up" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        {loading && (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-stack-lg">Loading…</p>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">campaign</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Nothing from admin yet.</p>
          </div>
        )}

        <div className="flex flex-col gap-gutter mt-stack-md">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/news/${item.id}`)}
              className="flex items-start gap-3 p-stack-md rounded-xl bg-surface-container border border-outline text-left active:scale-[0.98] transition-transform"
            >
              {item.attachment_url && (item.attachment_mime ? item.attachment_mime.startsWith('image/') : true) && (
                <img
                  src={item.attachment_url}
                  alt=""
                  className="w-14 h-14 flex-none rounded-lg object-cover border border-outline"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide">
                  {item.type === 'announcement' ? 'Announcement' : 'News'}
                </span>
                <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2 mt-0.5">{item.message}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{timeAgo(item.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default HeadsUp