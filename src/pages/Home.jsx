// RCFMOUAULIBRARYreact/student-dashboard/src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import BookGrid from '../components/resource/BookGrid'
import HorizontalRail from '../components/resource/HorizontalRail'
import AdvertBanner from '../components/ui/AdvertBanner'
import UpdatesList from '../components/ui/UpdatesList'
import NewsCarousel from '../components/ui/NewsCarousel'
import NewsPopupModal from '../components/ui/NewsPopupModal'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { resourcesApi, communityApi, newsApi } from '../services/api'
import { getMediaKind } from '../lib/mediaKind'
import { extractAccentColorMixedWithBlack } from '../lib/extractAccentColor'
import { shuffle } from '../lib/shuffle'
import { getDismissedNewsIds, addDismissedNewsId } from '../lib/dismissedNews'
import { useTour } from '../contexts/TourContext'

const ads = []

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const notificationIcon = {
  announcement: 'campaign',
  news: 'newspaper',
  advert: 'ads_click',
  resource_approved: 'check_circle',
  resource_rejected: 'error',
  request_resolved: 'inbox',
}

function laneOf(fileType) {
  const kind = getMediaKind(fileType)
  if (kind === 'video') return 'video'
  if (kind === 'audio') return 'audio'
  return 'book'
}

const CONTINUE_LANE_CONFIG = {
  book: {
    title: 'Continue Reading',
    progressSuffix: 'read',
    route: (id) => `/library/${id}`,
  },
  video: {
    title: 'Continue Watching',
    progressSuffix: 'watched',
    route: (id) => `/resources/${id}/read`,
  },
  audio: {
    title: 'Continue Listening',
    progressSuffix: 'listened',
    route: (id) => `/resources/${id}/read`,
  },
}

function ContinueCard({ item, kind, progressLabel, onClick }) {
  const [bgGradient, setBgGradient] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (item.thumbnail_url) {
      extractAccentColorMixedWithBlack(item.thumbnail_url).then((gradient) => {
        if (!cancelled) setBgGradient(gradient)
      })
    } else {
      setBgGradient(null)
    }
    return () => { cancelled = true }
  }, [item.thumbnail_url])

  return (
    <div
      className="relative border border-orange-500/10 rounded-2xl p-4 pl-28 pr-6 flex flex-col justify-center shadow-lg cursor-pointer"
      style={{ background: bgGradient || '#1A1412' }}
      onClick={onClick}
    >
      <div className="absolute -top-4 left-4 w-16 h-24 rounded-lg shadow-xl border border-white/10 overflow-hidden flex-shrink-0">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="relative w-full h-full bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 overflow-hidden">
            <svg className="w-full h-full opacity-30" viewBox="0 0 100 150" preserveAspectRatio="none">
              <path d="M0,30 Q25,60 50,30 T100,30 L100,150 L0,150 Z" fill="white" />
              <path d="M0,70 Q30,100 60,70 T100,80 L100,150 L0,150 Z" fill="white" opacity="0.5" />
            </svg>
          </div>
        )}
        {kind === 'video' && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">play_arrow</span>
            </span>
          </span>
        )}
        {kind === 'audio' && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">headphones</span>
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-white text-lg tracking-tight truncate">{item.title}</h3>
        <p className="text-white/70 font-medium text-xs tracking-wide truncate">
          {item.author ? `${item.author} ` : ''}
          <span className="text-white/50">•</span> {progressLabel}
        </p>
        <div className="w-full bg-white/15 h-1.5 rounded-full mt-2 overflow-hidden relative">
          <div
            className="bg-white/80 h-full rounded-full transition-all duration-300"
            style={{ width: `${item.progress_percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const headerHidden = useScrollDirection()
  const { startTour, hasCompletedTour, shouldForceStart } = useTour()

  const [recentBooks, setRecentBooks] = useState([])
  const [recentVideos, setRecentVideos] = useState([])
  const [recentAudios, setRecentAudios] = useState([])
  const [popularBooks, setPopularBooks] = useState([])
  const [continueItem, setContinueItem] = useState(null)
  const [continueLane, setContinueLane] = useState(null)
  const [jumpBackIn, setJumpBackIn] = useState([])
  const [notifications, setNotifications] = useState([])
  const [adminNews, setAdminNews] = useState([])
  const [externalNews, setExternalNews] = useState([])
  const [popupNews, setPopupNews] = useState(null)
  const [selectedNews, setSelectedNews] = useState(null)
  const [badgeCount, setBadgeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [recentRes, popularRes, historyRes, notificationsRes, newsRes] = await Promise.all([
          resourcesApi.list({ sort: 'recent', pageSize: 12 }),
          resourcesApi.list({ sort: 'popular', pageSize: 8 }),
          communityApi.readingHistory().catch(() => ({ items: [] })),
          communityApi.notifications().catch(() => ({ items: [] })),
          newsApi.latest().catch(() => ({ adminNews: [], external: [] })),
        ])
        if (cancelled) return

        const toCardItem = (r, subtitleFromAuthor = true) => ({
          id: r.id,
          title: r.title,
          author: r.author,
          subtitle: subtitleFromAuthor ? r.author : undefined,
          thumbnailUrl: r.thumbnail_url,
          thumbnailStatus: r.thumbnail_status,
          fileType: r.file_type,
          onClick: () => navigate(`/library/${r.id}`),
        })

        const recentItems = recentRes.items || []
        setRecentBooks(recentItems.filter((r) => laneOf(r.file_type) === 'book').map((r) => toCardItem(r, false)))
        setRecentVideos(shuffle(recentItems.filter((r) => laneOf(r.file_type) === 'video').map((r) => toCardItem(r))))
        setRecentAudios(shuffle(recentItems.filter((r) => laneOf(r.file_type) === 'audio').map((r) => toCardItem(r))))

        const popularItems = popularRes.items || []
        setPopularBooks(popularItems.filter((r) => laneOf(r.file_type) === 'book').map((r) => toCardItem(r)))

        const inProgress = (historyRes.items || []).filter((h) => !h.completed_at)

        const mostRecent = inProgress[0] || null
        setContinueItem(mostRecent)
        setContinueLane(mostRecent ? laneOf(mostRecent.file_type) : null)

        const jumpBackInItems = inProgress
          .slice()
          .sort((a, b) => new Date(b.last_accessed_at) - new Date(a.last_accessed_at))
          .slice(0, 10)
          .map((h) => {
            const kind = laneOf(h.file_type)
            const subtitle =
              kind === 'video' ? `${h.progress_percent}% watched` :
              kind === 'audio' ? `${h.progress_percent}% listened` :
              `${h.progress_percent}% read`
            return {
              id: h.resource_id,
              title: h.title,
              subtitle,
              thumbnailUrl: h.thumbnail_url,
              fileType: h.file_type,
              onClick: () => navigate(kind === 'book' ? `/library/${h.resource_id}` : `/resources/${h.resource_id}/read`),
            }
          })
        setJumpBackIn(jumpBackInItems)

        const allNotifications = notificationsRes.items || []
        setNotifications(allNotifications.slice(0, 3))

        const adminNewsItems = newsRes.adminNews || []
        setAdminNews(adminNewsItems)
        setExternalNews(newsRes.external || [])

        const dismissedNewsIds = getDismissedNewsIds()
        const unseenNewsCount = adminNewsItems.filter((a) => !dismissedNewsIds.includes(a.id)).length
        const unreadPersonalCount = allNotifications.filter((n) => !n.is_read).length
        setBadgeCount(unreadPersonalCount + unseenNewsCount)

        if (adminNewsItems.length > 0) {
          const latest = adminNewsItems[0]
          if (!dismissedNewsIds.includes(latest.id)) {
            setPopupNews(latest)
          }
        }
      } catch {
        // Home degrades gracefully — a failed section just doesn't render.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (loading) return
    const forced = shouldForceStart()
    if (!forced && hasCompletedTour()) return
    const timer = setTimeout(() => startTour(), 600)
    return () => clearTimeout(timer)
  }, [loading, hasCompletedTour, shouldForceStart, startTour])

  function handleDismissPopup() {
    if (popupNews) {
      addDismissedNewsId(popupNews.id)
      setBadgeCount((prev) => Math.max(prev - 1, 0))
    }
    setPopupNews(null)
  }

  function handleNotificationClick(n) {
    if (!n.is_read) {
      communityApi.markNotificationRead(n.id).catch(() => {})
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)))
      setBadgeCount((prev) => Math.max(prev - 1, 0))
    }
    navigate(n.link_to || '/notifications')
  }

  function handleDeleteNotification(id) {
    const target = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.is_read) setBadgeCount((prev) => Math.max(prev - 1, 0))
    communityApi.deleteNotification(id).catch(() => {})
  }

  const updates = notifications.map((n) => ({
    id: n.id,
    previewIcon: notificationIcon[n.type] || 'notifications',
    thumbnailUrl: n.thumbnail_url,
    count: 1,
    text: n.title,
    time: timeAgo(n.created_at),
    read: n.is_read,
    onClick: () => handleNotificationClick(n),
  }))

  const hasAnyContent =
    recentBooks.length > 0 || recentVideos.length > 0 || recentAudios.length > 0 || popularBooks.length > 0

  // Admin-posted items now carry the whole record (id, popup_style,
  // hidden_detail, link_url, attachment_mime) so NewsPopupModal can pick
  // the right render mode and "Read Full Detail" can route to /news/:id.
  const newsCarouselItems = [
    ...adminNews.map((a) => ({
      id: `admin-${a.id}`,
      title: a.title,
      body: a.message,
      imageUrl: a.attachment_url,
      badge: a.type === 'announcement' ? 'Heads Up' : 'Announcement',
      onClick: () => setSelectedNews({ ...a, onViewAll: true }),
    })),
    ...externalNews.map((e, i) => ({
      id: `external-${i}-${e.link}`,
      title: e.title,
      body: e.description,
      imageUrl: e.imageUrl,
      badge: e.sourceName,
      onClick: () => window.open(e.link, '_blank', 'noopener,noreferrer'),
    })),
  ]

  const continueConfig = continueLane ? CONTINUE_LANE_CONFIG[continueLane] : null

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar
        title="Home"
        rightIcons={
          <button
            data-tour="tour-notifications"
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-on-surface">notifications</span>
            {badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold leading-none flex items-center justify-center border-2 border-surface">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>
        }
      />

      <main className="pb-24 pt-[68px]">
        <section
          className={`sticky z-40 w-full px-margin-mobile pt-stack-md pb-stack-lg bg-background transition-[top] duration-300 ease-in-out ${
            headerHidden ? 'top-0' : 'top-[68px]'
          }`}
        >
          {/* data-tour lives on this inner div, not the <section> above —
              the section carries top/bottom padding for spacing plus the
              sticky positioning, and spotlighting it made the tour's hole
              taller and wider than the actual search pill (which is all
              the user should see highlighted). This div is exactly the
              visible pill, with no padding of its own. */}
          <div data-tour="tour-search" className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search the archives..."
              onFocus={() => navigate('/search')}
              readOnly
              className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md cursor-pointer"
            />
          </div>
        </section>

        <AdvertBanner ads={ads} />

        {newsCarouselItems.length > 0 && (
          <section className="mb-stack-lg">
            <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
              <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">News</h2>
              <button
                onClick={() => navigate('/notifications')}
                className="text-label-md font-label-md text-on-surface-variant hover:text-primary"
              >
                View all
              </button>
            </div>
            <NewsCarousel items={newsCarouselItems} />
          </section>
        )}

        {continueItem && continueConfig && (
          <section className="mb-stack-lg">
            <div className="px-margin-mobile mb-stack-sm">
              <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">{continueConfig.title}</h2>
            </div>
            <div className="px-margin-mobile mt-8">
              <ContinueCard
                item={continueItem}
                kind={continueLane}
                progressLabel={`${continueItem.progress_percent}% ${continueConfig.progressSuffix}`}
                onClick={() => navigate(continueConfig.route(continueItem.resource_id))}
              />
            </div>
          </section>
        )}

        {jumpBackIn.length > 0 && <HorizontalRail title="Jump Back In" items={jumpBackIn} />}

        {popularBooks.length > 0 && <HorizontalRail title="Popular With Fellow Readers" items={popularBooks} />}

        {recentVideos.length > 0 && <HorizontalRail title="New Videos" items={recentVideos} />}

        {recentAudios.length > 0 && <HorizontalRail title="New Audio" items={recentAudios} />}

        {!loading && recentBooks.length > 0 && (
          <BookGrid title="Recently Added" items={recentBooks} variant="compact" onSeeAll={() => navigate('/shelf?sort=recent')} />
        )}

        {!loading && !hasAnyContent && (
          <div className="px-margin-mobile py-stack-lg text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">library_add</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No resources yet — be the first to contribute one.
            </p>
          </div>
        )}

        {updates.length > 0 && (
          <UpdatesList updates={updates} onSeeAll={() => navigate('/notifications')} onDelete={handleDeleteNotification} />
        )}
      </main>

      <BottomNav />

      <NewsPopupModal
        news={popupNews}
        onClose={handleDismissPopup}
        onViewAll={
          popupNews
            ? () => {
                handleDismissPopup()
                navigate(`/news/${popupNews.id}`)
              }
            : undefined
        }
      />

      <NewsPopupModal
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
        onViewAll={
          selectedNews?.onViewAll
            ? () => {
                const targetId = selectedNews.id
                setSelectedNews(null)
                navigate(`/news/${targetId}`)
              }
            : undefined
        }
      />
    </div>
  )
}

export default Home