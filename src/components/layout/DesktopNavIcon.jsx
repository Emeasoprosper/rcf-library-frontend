const ICON_MAP = {
  home: 'home',
  search: 'search',
  library: 'local_library',
  contribute: 'volunteer_activism',
  profile: 'account_circle',
}

// playKey changes on every click, which remounts the span and replays
// that icon's animation even when the page is already active.
function DesktopNavIcon({ icon, active, playKey = 0 }) {
  const name = ICON_MAP[icon] || 'circle'
  return (
    <span key={playKey} className={`inline-flex ${playKey ? `dnav-anim-${icon}` : ''}`}>
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 26,
          fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' ${active ? 500 : 400}, 'GRAD' 0, 'opsz' 24`,
        }}
      >
        {name}
      </span>
    </span>
  )
}

export default DesktopNavIcon