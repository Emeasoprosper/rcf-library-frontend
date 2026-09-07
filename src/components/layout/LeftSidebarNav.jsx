// Desktop-only vertical primary nav (hidden below md — BottomNav takes
// over there). Same 5 destinations as BottomNav via shared navItems/NavIcon.
import { Link, useLocation } from 'react-router-dom'
import NavIcon from './NavIcon'
import InstallSidebarCard from './InstallSidebarCard'
import { navItems } from '../../lib/navItems'

function LeftSidebarNav() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex flex-col fixed top-[72px] left-0 w-56 h-[calc(100vh-72px)] z-30 bg-surface border-r border-outline py-6 px-3 gap-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isActive ? 'text-orange-500 font-semibold bg-orange-500/10' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <NavIcon icon={item.icon} active={isActive} />
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        )
      })}
      <InstallSidebarCard />
    </aside>
  )
}

export default LeftSidebarNav