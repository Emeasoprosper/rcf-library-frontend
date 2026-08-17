import { useNavigate } from 'react-router-dom'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useAuth } from '../../contexts/AuthContext'

function TopAppBar({ title, rightIcons, showBack = false }) {
  const hidden = useScrollDirection()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full px-margin-mobile py-stack-md bg-surface/80 backdrop-blur-md border-b border-outline transition-transform duration-300 ease-in-out ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors flex-none"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline overflow-hidden flex-none"
              aria-label="Go to profile"
            >
              {user?.avatarUrl ? (
                // referrerPolicy is required here — Google's avatar CDN
                // (lh3.googleusercontent.com) blocks requests that send a
                // referrer header from an unrecognized origin, which is
                // why a plain <img src=...> can silently fail to load
                // Google profile pictures on some setups.
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                  {user?.name ? user.name.charAt(0).toUpperCase() : ''}
                </div>
              )}
            </button>
          )}
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h1>
        </div>

        <div className="flex items-center gap-stack-sm">
          {rightIcons}
        </div>
      </div>
    </header>
  )
}

export default TopAppBar