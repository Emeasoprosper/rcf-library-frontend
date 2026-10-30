// pages/Notifications.jsx
// Mobile: this renders as its own full page (TopAppBar + BottomNav).
// Desktop: NotificationsModal.jsx renders NotificationsContent directly
// inside a centered popup instead — desktop must never show this as a
// full-screen page, same rule as the audio/video reader.
import { useEffect, useState } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import AttachmentViewerModal from '../components/ui/AttachmentViewerModal'
import { communityApi, newsApi } from '../services/api'
import { getDismissedNewsIds, addDismissedNewsId } from '../lib/dismissedNews'
import { useNavigate } from 'react-router-dom'
import { useIsDesktopViewport } from '../hooks/useIsDesktopViewport'
import { useNotificationsModal } from '../contexts/NotificationsModalContext'
import { NotificationsSkeleton } from '../components/ui/PageSkeletons'

const typeIcon = {
  announcement: 'campaign',
  news: 'newspaper',
  advert: 'ads_click',
  resource_approved: 'check_circle',
  resource_rejected: 'error',
  request_resolved: 'inbox',
}

// Colour of the icon tile shown when a notification has no picture.
const typeTile = {
  announcement: 'from-pink-500 to-rose-400',
  news: 'from-blue-500 to-cyan-400',
  advert: 'from-orange-500 to-amber-400',
  resource_approved: 'from-emerald-500 to-teal-400',
  resource_rejected: 'from-red-500 to-orange-400',
  request_resolved: 'from-violet-500 to-purple-400',
}

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationsContent() {
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
    <div className="w-full">
      <div className="px-margin-mobile pt-4">
        {loading && <NotificationsSkeleton />}

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
              className={`rcf-lift group relative flex items-center gap-3 p-3 rounded-2xl border transition-opacity ${
                n.is_read ? 'bg-surface-container/60 border-outline/60' : 'bg-surface-container border-outline'
              } ${dismissingId === n.id ? 'opacity-30' : ''}`}
            >
              <button onClick={() => handleOpen(n)} className="flex items-center gap-3 flex-grow min-w-0 text-left">
                {/* Picture on the left: the attached image/cover, or a coloured icon tile */}
                {n.thumbnail_url ? (
                  <img
                    src={n.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 flex-none rounded-xl object-cover border border-outline bg-surface-container-high"
                  />
                ) : (
                  <span
                    className={`w-14 h-14 flex-none rounded-xl flex items-center justify-center bg-gradient-to-br ${
                      typeTile[n.type] || 'from-slate-500 to-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-white text-[26px]">{typeIcon[n.type] || 'notifications'}</span>
                  </span>
                )}

                <div className="flex-grow min-w-0">
                  <p className={`font-body-md text-body-md text-on-surface leading-snug line-clamp-2 ${n.is_read ? '' : 'font-semibold'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>

              <div className="flex flex-col items-center gap-2 flex-none self-stretch justify-between">
                <button
                  onClick={(e) => handleDismiss(e, n)}
                  disabled={dismissingId === n.id}
                  className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                  aria-label="Dismiss notification"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
                </button>
                {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-primary mb-1" aria-label="Unread" />}
              </div>
            </div>
          ))}
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

function Notifications() {
  const isDesktop = useIsDesktopViewport()
  const navigate = useNavigate()
  const { openModal } = useNotificationsModal()

  // Desktop must never render this as a full centered page — same rule
  // as the audio/video/pdf reader. Redirect straight into the popup.
  useEffect(() => {
    if (!isDesktop) return
    openModal()
    navigate(-1)
  }, [isDesktop, openModal, navigate])

  if (isDesktop) return null

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-80 lg:pr-80">
      <TopAppBar title="Notifications" showBack />
      <main className="pb-24 pt-[68px] md:pt-24">
        <NotificationsContent />
      </main>
      <BottomNav />
    </div>
  )
}

export default Notifications