import { useNavigate } from 'react-router-dom'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useAuth } from '../../contexts/AuthContext'
import { useHeaderAmbient } from '../../contexts/HeaderAmbientContext'

function TopAppBar({ title, rightIcons, showBack = false }) {
  const hidden = useScrollDirection()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ambient } = useHeaderAmbient()

  // Opt-in per page via HeaderAmbientContext (only CollectionPage sets
  // this right now). Every other screen leaves ambient null, so this
  // header renders exactly as before — solid bar, title always visible.
  const titleOpacity = ambient ? Math.min(Math.max((ambient.progress - 0.15) / 0.85, 0), 1) : 1
  const iconTone = ambient && ambient.progress > 0.15 ? 'text-white' : 'text-on-surface'

  return (
    <header
      className={`fixed top-0 left-0 z-[100] w-full px-margin-mobile py-stack-md border-b transition-transform duration-300 ease-in-out md:hidden ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${ambient ? 'border-transparent' : 'border-outline'} relative`}
      style={ambient ? { backgroundColor: 'transparent' } : undefined}
    >
      {ambient ? (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: ambient.color,
            opacity: Math.min(ambient.progress + 0.15, 1),
            backdropFilter: `blur(${ambient.progress * 16}px)`,
            WebkitBackdropFilter: `blur(${ambient.progress * 16}px)`,
          }}
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-surface/80 backdrop-blur-md" />
      )}
      <div className={`flex justify-between items-center ${iconTone}`}>
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-none ${ambient ? 'hover:bg-white/10' : 'hover:bg-surface-container-high'}`}
              aria-label="Go back"
            >
              <span className={`material-symbols-outlined ${ambient ? 'text-current' : 'text-on-surface'}`}>arrow_back</span>
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
          <h1
            className="font-headline-md text-headline-md font-bold"
            style={ambient ? { opacity: titleOpacity, transition: 'opacity 100ms' } : undefined}
          >
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-stack-sm">
          {rightIcons}
        </div>
      </div>
    </header>
  )
}

export default TopAppBar