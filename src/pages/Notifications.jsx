// pages/Notifications.jsx
import { useEffect, useState } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import AttachmentViewerModal from '../components/ui/AttachmentViewerModal'
import { communityApi, newsApi } from '../services/api'
import { getDismissedNewsIds, addDismissedNewsId } from '../lib/dismissedNews'

const typeIcon = {
  announcement: 'campaign',
  news: 'newspaper',
  advert: 'ads_click',
  resource_approved: 'check_circle',
  resource_rejected: 'error',
  request_resolved: 'inbox',
}

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dismissingId, setDismissingId] = useState(null)
  const [viewerItem, setViewerItem] = useState(null) // { title, url } | null

  useEffect(() => {
    Promise.all([
      communityApi.notifications().catch(() => ({ items: [] })),
      newsApi.latest().catch(() => ({ adminNews: [] })),
    ])
      .then(([personal, news]) => {
        const dismissed = getDismissedNewsIds()

        const adminNewsItems = (news.adminNews || [])
          .filter((a) => !dismissed.includes(a.id))
          .map((a) => ({
            id: `news-${a.id}`,
            rawId: a.id,
            type: 'news',
            title: a.title,
            body: a.message,
            thumbnail_url: a.attachment_url,
            is_read: true,
            is_global: true,
            created_at: a.created_at,
          }))

        // External (RSS-syndicated) articles — see Home.jsx's News
        // carousel, which already shows these alongside adminNews. They
        // carry no created_at or numeric id from our own database, so
        // they can't be merged into the date-sorted list below the same
        // way. Shown as their own block instead, opening the original
        // source link directly rather than the in-app attachment viewer.
        const externalItems = (news.external || []).map((e, i) => ({
          id: `external-${i}`,
          type: 'news',
          title: e.title,
          body: e.sourceName,
          thumbnail_url: e.imageUrl,
          is_read: true,
          is_external: true,
          link: e.link,
        }))

        const merged = [...adminNewsItems, ...(personal.items || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setNotifications([...externalItems, ...merged])
      })
      .catch(() => setError("Couldn't load notifications. Pull down to try again."))
      .finally(() => setLoading(false))
  }, [])

  const handleOpen = async (n) => {
    if (n.is_external) {
      window.open(n.link, '_blank', 'noopener,noreferrer')
      return
    }
    if (n.thumbnail_url) {
      setViewerItem({ title: n.title, url: n.thumbnail_url })
    }
    if (n.is_global || n.is_read) return
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    try {
      await communityApi.markNotificationRead(n.id)
    } catch {
      // Non-critical — if this fails, worst case it shows unread again next load.
    }
  }

  const handleDismiss = async (e, n) => {
    e.stopPropagation()
    const previous = notifications
    setNotifications((prev) => prev.filter((x) => x.id !== n.id))

    // External items have no backend id to persist a dismissal against
    // — they're re-fetched fresh from the RSS cache each visit, so a
    // local-only removal for this session is the correct behavior here.
    if (n.is_external) return

    if (n.is_global) {
      addDismissedNewsId(n.rawId)
      return
    }

    setDismissingId(n.id)
    try {
      await communityApi.deleteNotification(n.id)
    } catch {
      setNotifications(previous)
    } finally {
      setDismissingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Notifications" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        {loading && (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-stack-lg">
            Loading…
          </p>
        )}

        {!loading && error && (
          <p className="font-body-md text-body-md text-error text-center py-stack-lg">{error}</p>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">
              notifications_none
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">You're all caught up.</p>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-stack-md rounded-xl bg-surface-container border border-outline transition-opacity ${
                n.is_read ? 'opacity-60' : ''
              } ${dismissingId === n.id ? 'opacity-30' : ''}`}
            >
              <button
                onClick={() => handleOpen(n)}
                className="flex items-start gap-3 flex-grow min-w-0 text-left"
              >
                <span className="material-symbols-outlined text-primary flex-none mt-0.5">
                  {typeIcon[n.type] || 'notifications'}
                </span>
                <div className="flex-grow min-w-0">
                  <p className={`font-body-md text-body-md text-on-surface break-words ${n.is_read ? '' : 'font-semibold'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 break-words">{n.body}</p>
                  )}
                  {n.thumbnail_url && (
                    <img
                      src={n.thumbnail_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover mt-2 border border-outline"
                    />
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-none mt-2" />}
              </button>
              <button
                onClick={(e) => handleDismiss(e, n)}
                disabled={dismissingId === n.id}
                className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors flex-none disabled:opacity-50"
                aria-label="Dismiss notification"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  close
                </span>
              </button>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />

      <AttachmentViewerModal
        open={!!viewerItem}
        onClose={() => setViewerItem(null)}
        title={viewerItem?.title}
        url={viewerItem?.url}
      />
    </div>
  )
}

export default Notifications