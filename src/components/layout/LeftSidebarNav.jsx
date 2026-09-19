// Desktop-only vertical primary nav (hidden below md — BottomNav takes
// over there). Same 5 destinations as BottomNav via shared navItems/NavIcon.
// Desktop-only left column. Was the primary nav (Home/Library/etc.) —
// those moved into DesktopHeader.jsx. This now shows the Updates feed
// that RightSidebarPanel.jsx used to own; RightSidebarPanel is
// reader-only now. Hidden below md, same as before — mobile unaffected.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import UpdatesList from '../ui/UpdatesList'
import InstallSidebarCard from './InstallSidebarCard'
import { communityApi } from '../../services/api'
import { useNotificationsModal } from '../../contexts/NotificationsModalContext'

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
    <aside className="hidden md:flex flex-col fixed top-[72px] left-0 w-80 h-[calc(100vh-72px)] z-30 bg-surface border-r border-outline overflow-y-auto py-6">
      {updates.length > 0 ? (
        <UpdatesList updates={updates} onSeeAll={openModal} onDelete={handleDelete} />
      ) : (
        <p className="px-3 font-label-sm text-label-sm text-on-surface-variant">No updates yet.</p>
      )}
      <div className="px-3 mt-4">
        <InstallSidebarCard />
      </div>
    </aside>
  )
}

export default LeftSidebarNav