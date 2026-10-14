// Desktop-only global header (hidden below md — TopAppBar + BottomNav
// take over there instead). Never hides on scroll.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi, newsApi } from '../../services/api'
import { getDismissedNewsIds } from '../../lib/dismissedNews'
import logo from '../../assets/RCFmouau.svg'
import DesktopNavIcon from './DesktopNavIcon'
import OnlinePill from './OnlinePill'
import { navItems, TOUR_NAV_IDS } from '../../lib/navItems'
import { useNotificationsModal } from '../../contexts/NotificationsModalContext'

function DesktopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const { user } = useAuth()
  const [badgeCount, setBadgeCount] = useState(0)
  const [clicked, setClicked] = useState({ to: null, n: 0 })
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

  useEffect(() => { loadBadgeCount() }, [loadBadgeCount])

  const handleNavClick = (to) => {
    setClicked((c) => ({ to, n: c.n + 1 }))
    navigate(to)
  }

  return (
    <header style={{ left: 'var(--hd-left)' }} className="hidden md:flex fixed top-0 right-0 h-[72px] z-40 min-w-0 items-center gap-6 px-6 bg-surface border-b border-outline transition-[left] duration-300 ease-in-out">
      <style>{`
        @keyframes dnavHome { 0% { transform: translateY(0); } 30% { transform: translateY(-7px) scale(1.12); } 60% { transform: translateY(1px); } 100% { transform: translateY(0); } }
        @keyframes dnavSearch { 0% { transform: scale(1) rotate(0); } 35% { transform: scale(1.28) rotate(-18deg); } 70% { transform: scale(0.95) rotate(8deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes dnavLibrary { 0% { transform: rotate(0); } 25% { transform: rotate(-14deg) scale(1.1); } 55% { transform: rotate(10deg); } 100% { transform: rotate(0); } }
        @keyframes dnavContribute { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(180deg) scale(1.25); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes dnavProfile { 0% { transform: scale(1); } 40% { transform: scale(1.4); } 70% { transform: scale(0.92); } 100% { transform: scale(1); } }
        .dnav-anim-home { animation: dnavHome 450ms ease-out; }
        .dnav-anim-search { animation: dnavSearch 450ms ease-out; }
        .dnav-anim-library { animation: dnavLibrary 500ms ease-out; }
        .dnav-anim-contribute { animation: dnavContribute 600ms ease-in-out; }
        .dnav-anim-profile { animation: dnavProfile 450ms ease-out; }
      `}</style>

      <button onClick={() => navigate('/home')} className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-2.5 flex-none`} aria-label="Home">
        <img src={logo} alt="" className="h-9 w-9" />
      </button>

      <nav className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-1 flex-none`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => handleNavClick(item.to)}
              aria-label={item.label}
              data-tour={TOUR_NAV_IDS[item.icon] ? `${TOUR_NAV_IDS[item.icon]}-desktop` : undefined}
              title={item.label}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 ${
                isActive ? 'text-orange-500 bg-orange-500/10' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <DesktopNavIcon icon={item.icon} active={isActive} playKey={clicked.to === item.to ? clicked.n : 0} />
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-4 flex-none">
        <OnlinePill />
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