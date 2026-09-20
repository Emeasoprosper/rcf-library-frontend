import { useNavigate } from 'react-router-dom'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useAuth } from '../../contexts/AuthContext'
import { useHeaderAmbient } from '../../contexts/HeaderAmbientContext'

// titleRef: optional ref forwarded to the <h1> so a page can measure its
// real on-screen position (used by CollectionPage.jsx to land a moving
// hero title exactly on top of this one).
// tabs/activeTab/onTabChange: optional second row docked under the
// title, fading in with the same progress as the title. Only used by
// CollectionPage.jsx — every other caller omits these and gets the
// exact same header as before.
function TopAppBar({ title, rightIcons, showBack = false, titleRef, tabs, activeTab, onTabChange }) {
  const hidden = useScrollDirection()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ambient } = useHeaderAmbient()

  // Opt-in per page via HeaderAmbientContext (only CollectionPage sets
  // this right now). Every other screen leaves ambient null, so this
  // header renders exactly as before — solid bar, title always visible.
  // Title only fades in right at the end of the scroll range, so for
  // most of the transition the only thing visible is the moving hero
  // title (see CollectionPage's position-matching effect) — this one
  // crossfades in only once it's sitting exactly on top of it.
  const titleOpacity = ambient ? Math.min(Math.max((ambient.progress - 0.85) / 0.15, 0), 1) : 1
  const tabsOpacity = ambient ? Math.min(Math.max((ambient.progress - 0.5) / 0.4, 0), 1) : 1
  const iconTone = ambient && ambient.progress > 0.15 ? 'text-white' : 'text-on-surface'

  return (
    <header
      className={`fixed top-0 left-0 z-[9999] w-full px-margin-mobile py-stack-md border-b transition-transform duration-300 ease-in-out md:hidden isolate ${
        !ambient && hidden ? '-translate-y-full' : 'translate-y-0'
      } ${ambient ? 'border-transparent' : 'border-outline'}`}
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
            ref={titleRef}
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

      {tabs && (
        <div
          className="flex gap-6 mt-3 -mb-stack-md pb-2"
          style={{ opacity: tabsOpacity, transition: 'opacity 100ms', pointerEvents: tabsOpacity > 0.5 ? 'auto' : 'none' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`pb-1 font-label-md text-label-md relative ${
                activeTab === tab ? 'font-semibold text-current' : 'text-current/70'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-current rounded-full" />}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

export default TopAppBar