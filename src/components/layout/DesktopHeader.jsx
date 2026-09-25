// Desktop-only global header (hidden below md — TopAppBar + BottomNav
// take over there instead). Never hides on scroll, unlike TopAppBar:
// Part 4 of the brief requires the header to stay stable.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi, newsApi } from '../../services/api'
import { getDismissedNewsIds, addDismissedNewsId } from '../../lib/dismissedNews'
import logo from '../../assets/RCFmouau.svg'
import NavIcon from './NavIcon'
import { navItems, TOUR_NAV_IDS } from '../../lib/navItems'
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

function DesktopHeader() {
  const navigate = useNavigate()
  const location = useLocation(); const isAdmin = location.pathname.startsWith('/admin')
  const { user } = useAuth()
  const [badgeCount, setBadgeCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const { openModal } = useNotificationsModal()

  const loadBadgeCount = useCallback(() => {
    Promise.all([
      communityApi.notifications().catch(() => ({ items: [] })),
      newsApi.latest().catch(() => ({ adminNews: [] })),
    ]).then(([personal, news]) => {
      const dismissed = getDismissedNewsIds()
      const adminNewsCount = (news.adminNews || []).filter((a) => !dismissed.includes(a.id)).length
      const unreadPersonal = (personal.items || []).filter((n) => !n.is_read).length
      setBadgeCount(unreadPersonal + adminNewsCount)
    })
  }, [])

  useEffect(() => {
    if (location.pathname !== '/search' && !location.pathname.startsWith('/library')) {
      setSearchValue('')
    }
  }, [location.pathname])

  function targetSearchPath() {
    return location.pathname.startsWith('/library') ? '/library' : '/search'
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const trimmed = searchValue.trim()
    if (!trimmed) return
    navigate(`${targetSearchPath()}?q=${encodeURIComponent(trimmed)}`)
  }

  useEffect(() => { loadBadgeCount() }, [loadBadgeCount])

  return (
    <header style={{ left: 'var(--hd-left)' }} className="hidden md:flex fixed top-0 right-0 h-[72px] z-40 min-w-0 items-center gap-6 px-6 bg-surface border-b border-outline transition-[left] duration-300 ease-in-out">
      <button onClick={() => navigate('/home')} className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-2.5 flex-none`} aria-label="Home">
        <img src={logo} alt="" className="h-9 w-9" />
      </button>

      <nav className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-1 flex-none`}>
        {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => {
          const isActive = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              data-tour={TOUR_NAV_IDS[item.icon] ? `${TOUR_NAV_IDS[item.icon]}-desktop` : undefined}
              title={item.label}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                isActive ? 'text-orange-500 bg-orange-500/10' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="inline-flex scale-125">
                <NavIcon icon={item.icon} active={isActive} />
              </span>
            </button>
          )
        })}
      </nav>

      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 max-w-xl mx-auto">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => {
              const target = targetSearchPath()
              if (location.pathname !== target) navigate(target)
            }}
            placeholder="Search the archives..."
            className="w-full h-11 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
          />
        </div>
      </form>

      <nav className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-1 flex-none`}>
        {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => {
          const isActive = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              data-tour={TOUR_NAV_IDS[item.icon] ? `${TOUR_NAV_IDS[item.icon]}-desktop` : undefined}
              title={item.label}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                isActive ? 'text-orange-500 bg-orange-500/10' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="inline-flex scale-125">
                <NavIcon icon={item.icon} active={isActive} />
              </span>
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-4 flex-none">
        <button
          data-tour="tour-notifications-desktop"
          onClick={() => { setBadgeCount(0); openModal() }}
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
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline overflow-hidden flex-none"
          aria-label="Go to profile"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name || 'Profile'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
              {user?.name ? user.name.charAt(0).toUpperCase() : ''}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}

export default DesktopHeader