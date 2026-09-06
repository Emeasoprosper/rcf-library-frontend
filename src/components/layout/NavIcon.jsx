// Shared nav icon set — used by BottomNav (mobile) and LeftSidebarNav
// (desktop). The animation keyframes these icons reference
// (bn-anim-home-dot, etc.) are defined once in BottomNav.jsx's <style>
// block, which stays mounted (CSS-hidden via md:hidden, never
// unmounted) at every viewport width — that's what makes it safe for
// LeftSidebarNav to reuse the same class names without its own copy.
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

export default NavIcon