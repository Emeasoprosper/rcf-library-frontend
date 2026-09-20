// Desktop-only left column (hidden below md).
// Normal mode: Updates feed + install card, 320px wide.
// Admin mode (/admin/*): shrinks to an 80px icon rail — home logo on top,
// admin nav below. Width/top/height come from CSS variables in index.css,
// so switching modes animates.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import UpdatesList from '../ui/UpdatesList'
import InstallSidebarCard from './InstallSidebarCard'
import { AdminRail } from './AdminNav'
import { communityApi } from '../../services/api'
import { useNotificationsModal } from '../../contexts/NotificationsModalContext'
import logo from '../../assets/RCFmouau.svg'

const notificationIcon = {
  announcement: 'campaign',
  news: 'newspaper',
  advert: 'ads_click',
  resource_approved: 'check_circle',
  resource_rejected: 'error',
  request_resolved: 'inbox',
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function LeftSidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const { openModal } = useNotificationsModal()
  const [notifications, setNotifications] = useState([])

  const load = useCallback(() => {
    communityApi.notifications()
      .then((res) => setNotifications((res.items || []).slice(0, 6)))
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  function handleClick(n) {
    if (!n.is_read) {
      communityApi.markNotificationRead(n.id).catch(() => {})
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)))
    }
    navigate(n.link_to || '/notifications')
  }

  function handleDelete(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
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
    onClick: () => handleClick(n),
  }))

  return (
    <aside
      style={{ width: 'var(--sb-left)', top: 'var(--sb-top)', height: 'calc(100vh - var(--sb-top))' }}
      className="hidden md:block fixed left-0 z-30 bg-surface border-r border-outline overflow-hidden transition-[width,top,height] duration-300 ease-in-out"
    >
      <div
        className={`absolute inset-y-0 left-0 w-80 flex flex-col overflow-y-auto py-6 transition-opacity duration-200 ${
          isAdmin ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
        }`}
      >
        {updates.length > 0 ? (
          <UpdatesList updates={updates} onSeeAll={openModal} onDelete={handleDelete} />
        ) : (
          <p className="px-3 font-label-sm text-label-sm text-on-surface-variant">No updates yet.</p>
        )}
        <div className="px-3 mt-4">
          <InstallSidebarCard />
        </div>
      </div>

      <div
        className={`absolute inset-y-0 left-0 w-20 transition-opacity duration-200 ${
          isAdmin ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate('/home')}
          className="h-[72px] w-full flex items-center justify-center"
          aria-label="Home"
        >
          <img src={logo} alt="" className="h-9 w-9" />
        </button>
        <AdminRail />
      </div>
    </aside>
  )
}

export default LeftSidebarNav