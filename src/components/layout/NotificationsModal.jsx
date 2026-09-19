// Desktop-only "View all" destination — replaces navigating to the
// full-page /notifications route (that page is mobile's, and must never
// take over the center column on desktop). Mirrors Notifications.jsx's
// data and behavior inside an overlay instead. Rendered once in App.jsx.
import { useEffect, useState } from 'react'
import AttachmentViewerModal from '../ui/AttachmentViewerModal'
import { communityApi, newsApi } from '../../services/api'
import { getDismissedNewsIds, addDismissedNewsId } from '../../lib/dismissedNews'
import { useNotificationsModal } from '../../contexts/NotificationsModalContext'

const typeIcon = {
  announcement: 'campaign',
  news: 'newspaper',
  advert: 'ads_click',
  resource_approved: 'check_circle',
  resource_rejected: 'error',
  request_resolved: 'inbox',
}

function NotificationsModal() {
  const { open, closeModal } = useNotificationsModal()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dismissingId, setDismissingId] = useState(null)
  const [viewerItem, setViewerItem] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
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
      .catch(() => setError("Couldn't load notifications."))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const handleOpen = async (n) => {
    if (n.is_external) {
      window.open(n.link, '_blank', 'noopener,noreferrer')
      return
    }
    if (n.thumbnail_url) setViewerItem({ title: n.title, url: n.thumbnail_url })
    if (n.is_global || n.is_read) return
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    try {
      await communityApi.markNotificationRead(n.id)
    } catch {}
  }

  const handleDismiss = async (e, n) => {
    e.stopPropagation()
    const previous = notifications
    setNotifications((prev) => prev.filter((x) => x.id !== n.id))
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
    <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center bg-black/50" onClick={closeModal}>
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col bg-surface border border-outline rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline flex-none">
          <h2 className="font-headline-md text-headline-md font-display text-on-surface">Notifications</h2>
          <button onClick={closeModal} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high" aria-label="Close">
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <p className="font-body-md text-body-md text-on-surface-variant text-center py-stack-lg">Loading…</p>
          )}
          {!loading && error && (
            <p className="font-body-md text-body-md text-error text-center py-stack-lg">{error}</p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center text-center py-stack-lg">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">notifications_none</span>
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
                <button onClick={() => handleOpen(n)} className="flex items-start gap-3 flex-grow min-w-0 text-left">
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
                      <img src={n.thumbnail_url} alt="" className="w-16 h-16 rounded-lg object-cover mt-2 border border-outline" />
                    )}
                    {n.created_at && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-none mt-2" />}
                </button>
                <button
                  onClick={(e) => handleDismiss(e, n)}
                  disabled={dismissingId === n.id}
                  className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors flex-none disabled:opacity-50"
                  aria-label="Dismiss notification"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AttachmentViewerModal
        open={!!viewerItem}
        onClose={() => setViewerItem(null)}
        title={viewerItem?.title}
        url={viewerItem?.url}
      />
    </div>
  )
}

export default NotificationsModal