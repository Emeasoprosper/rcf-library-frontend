import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/uploads', icon: 'upload', label: 'Uploads' },
  { to: '/admin/requests', icon: 'inbox', label: 'Requests' },
  { to: '/admin/users', icon: 'group', label: 'Users' },
  { to: '/admin/announcements', icon: 'campaign', label: 'Announce' },
]

// Desktop: same items as vertical icons inside the left rail
// (rendered by LeftSidebarNav.jsx in admin mode).
export function AdminRail() {
  const location = useLocation()

  return (
    <nav className="flex flex-col items-center gap-2 pt-4">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            aria-label={item.label}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive
                ? 'text-orange-500 bg-orange-500/10'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile: bottom bar (hidden on desktop, where the rail replaces it).
function AdminNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 md:left-[var(--sb-left)] md:w-[var(--sb-w-md)] lg:w-[var(--sb-w-lg)] left-0 w-full z-50 px-4 pb-6 pt-3 bg-surface/80 backdrop-blur-md border-t border-outline md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-90 ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default AdminNav