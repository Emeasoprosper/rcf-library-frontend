import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/home', icon: 'home', label: 'Home' },
  { to: '/search', icon: 'search', label: 'Search' },
  { to: '/shelf', icon: 'library', label: 'Library' },
  { to: '/contribute', icon: 'contribute', label: 'Contribute' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
]

// Each icon's accent piece (the dot, the page fold, the head, etc.) is
// orange only while its tab is active — currentColor (inherited from the
// wrapping Link's text color, same white/gray as the label) the rest of
// the time. The outline strokes always use currentColor. This is what
// gives the "changes when clicked, reverts when you pick another tab"
// effect — no separate click state needed, it just follows the route.
function NavIcon({ icon, active }) {
  const accent = active ? '#f97316' : 'currentColor'

  switch (icon) {
    case 'home':
      return (
        <svg viewBox="0 0 52 52" fill="none" className="w-6 h-6">
          <path
            d="M 11 28 V 23 Q 11 16 16 12 L 23 7 Q 26 5 29 7 L 36 12 Q 41 16 41 23 V 28"
            stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <rect x="22.5" y="25" width="7" height="4" rx="2" fill="currentColor" />
          <circle className={active ? 'bn-anim-home-dot' : ''} cx="26" cy="19" r="3.5" fill={accent} />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 52 52" fill="none" className="w-6 h-6">
          <circle className={active ? 'bn-anim-search-lens' : ''} cx="22" cy="22" r="12" stroke="currentColor" strokeWidth="4.5" />
          <path className={active ? 'bn-anim-search-handle' : ''} d="M 31 31 L 41 41" stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      )
    case 'library':
      return (
        <svg viewBox="0 0 52 52" fill="none" className="w-6 h-6">
          <path className={active ? 'bn-anim-page-2' : ''} d="M 33 13 C 37 13 38 15 38 18 V 33 C 38 34 36 35 33 35 H 32 V 13 H 33 Z" fill={accent} opacity={active ? 1 : 0.45} />
          <path className={active ? 'bn-anim-page-1' : ''} d="M 28 11 C 32 11 34 13 34 16 V 35 C 34 36 32 37 28 37 H 27 V 11 H 28 Z" fill={accent} opacity={active ? 0.7 : 0.3} />
          <path d="M 14 10 H 22 C 25 10 27 12 27 15 V 36 C 27 38 25 39 22 39 H 17 C 14.5 39 13 37.5 13 35 V 11 C 13 10.4 13.4 10 14 10 Z" fill="currentColor" />
          <path d="M 13 35 C 13 37.5 14.5 39 17 39 H 26 C 28.5 39 30 38 30 36.5 C 30 35 28.5 34.5 26 34.5 H 15 C 13.9 34.5 13 34 13 33 V 35 Z" fill="currentColor" />
        </svg>
      )
    case 'contribute':
      return (
        <svg viewBox="0 0 52 52" fill="none" className="w-6 h-6">
          <path d="M 13 22 C 14 14 21 9 29 10" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 39 30 C 38 38 31 43 23 42" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <g className={active ? 'bn-anim-contribute-dots' : ''}>
            <circle cx="26" cy="10" r="5" fill={accent} />
            <circle cx="26" cy="42" r="5" fill={accent} />
          </g>
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 52 52" fill="none" className="w-6 h-6">
          <path className={active ? 'bn-anim-profile-arc' : ''} d="M 39 25 A 15 15 0 1 0 39 27" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <circle className={active ? 'bn-anim-profile-head' : ''} cx="26" cy="21" r="5.5" fill={accent} />
          <path d="M 18 36 C 18 31 21.5 29 26 29 C 30.5 29 34 31 34 36" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 px-4 pt-2 bg-surface/80 backdrop-blur-md [mask-image:linear-gradient(to_top,black_78%,rgba(0,0,0,0.95)_85%,rgba(0,0,0,0.55)_92%,transparent_100%)]"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <style>{`
        @keyframes bnHomeBounce { 0% { transform: translateY(0); } 40% { transform: translateY(-4px); } 70% { transform: translateY(1px); } 100% { transform: translateY(0); } }
        .bn-anim-home-dot { animation: bnHomeBounce 0.5s cubic-bezier(0.175,0.885,0.32,1.275); transform-origin: 26px 19px; }

        @keyframes bnSearchPulse { 0% { transform: scale(0.75); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .bn-anim-search-lens { animation: bnSearchPulse 0.4s ease-out; transform-origin: 22px 22px; }
        @keyframes bnSearchHandle { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        .bn-anim-search-handle { animation: bnSearchHandle 0.3s ease-out 0.15s both; transform-origin: 31px 31px; }

        @keyframes bnPageFanLeft { 0% { transform: translateX(0); } 50% { transform: translateX(-2px); } 100% { transform: translateX(0); } }
        .bn-anim-page-1 { animation: bnPageFanLeft 0.5s cubic-bezier(0.25,1,0.5,1); }
        @keyframes bnPageFanRight { 0% { transform: translateX(0); } 50% { transform: translateX(3px); } 100% { transform: translateX(0); } }
        .bn-anim-page-2 { animation: bnPageFanRight 0.5s cubic-bezier(0.25,1,0.5,1); }

        @keyframes bnSpinDots { 0% { transform: rotate(0deg); } 100% { transform: rotate(180deg); } }
        .bn-anim-contribute-dots { animation: bnSpinDots 0.6s cubic-bezier(0.4,0,0.2,1); transform-origin: 26px 26px; }

        @keyframes bnHeadPop { 0% { transform: scale(0.7); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .bn-anim-profile-head { animation: bnHeadPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275); transform-origin: 26px 21px; }
        @keyframes bnArcRotate { 0% { transform: rotate(0deg); } 50% { transform: rotate(-20deg); } 100% { transform: rotate(0deg); } }
        .bn-anim-profile-arc { animation: bnArcRotate 0.6s ease-in-out; transform-origin: 26px 26px; }
      `}</style>

      <div className="flex justify-around items-center [mask-image:none]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 transition-colors duration-150 active:scale-90 ${
                isActive ? 'text-orange-500 font-semibold' : 'text-on-surface-variant'
              }`}
            >
              <NavIcon icon={item.icon} active={isActive} />
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav