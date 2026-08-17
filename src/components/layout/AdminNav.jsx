import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/uploads', icon: 'upload', label: 'Uploads' },
  { to: '/admin/requests', icon: 'inbox', label: 'Requests' },
  { to: '/admin/users', icon: 'group', label: 'Users' },
  { to: '/admin/announcements', icon: 'campaign', label: 'Announce' },
]

function AdminNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-3 bg-surface/80 backdrop-blur-md border-t border-outline">
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
