import { House, Search, LibraryBig, BookPlus, CircleUserRound, Circle } from 'lucide-react'

// One consistent line-icon family (Lucide) for the desktop nav.
const ICON_MAP = {
  home: House,
  search: Search,
  library: LibraryBig,
  contribute: BookPlus,
  profile: CircleUserRound,
}

// playKey changes on every click, which remounts the span and replays
// that icon's animation even when the page is already active.
function DesktopNavIcon({ icon, active, playKey = 0 }) {
  const Icon = ICON_MAP[icon] || Circle
  return (
    <span key={playKey} className={`inline-flex ${playKey ? `dnav-anim-${icon}` : ''}`}>
      <Icon
        size={24}
        strokeWidth={active ? 2.3 : 1.7}
        absoluteStrokeWidth
        aria-hidden="true"
        style={{ fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.14 : 0 }}
      />
    </span>
  )
}

export default DesktopNavIcon
