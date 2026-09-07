// Desktop-only global header (hidden below md — TopAppBar + BottomNav
// take over there instead). Never hides on scroll, unlike TopAppBar:
// Part 4 of the brief requires the header to stay stable.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi } from '../../services/api'
import logo from '../../assets/RCFmouau.svg'

function DesktopHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    communityApi.notifications()
      .then((res) => {
        if (cancelled) return
        setBadgeCount((res.items || []).filter((n) => !n.is_read).length)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <header className="hidden md:flex fixed top-0 left-0 w-full h-[72px] z-40 items-center gap-6 px-6 bg-surface border-b border-outline">
      <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 flex-none" aria-label="Home">
        <img src={logo} alt="" className="h-9 w-9" />
      </button>

      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search the archives..."
            onFocus={() => navigate('/search')}
            readOnly
            className="w-full h-11 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-none">
        <button
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