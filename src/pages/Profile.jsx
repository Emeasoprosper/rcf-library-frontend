import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { icon: 'bookmark', label: 'Saved Resources', to: '/saved' },
  { icon: 'download_for_offline', label: 'Downloads', to: '/downloads' },
  { icon: 'history', label: 'Reading History', to: '/reading-history' },
  { icon: 'notifications', label: 'Notifications', to: '/notifications' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
  { icon: 'help', label: 'Help & Support', to: '/help' },
]

function categoryLabel(user) {
  if (!user?.category) return null
  if (user.affiliation === 'mouau' && user.category === 'student' && user.level) {
    return `${user.level}L Student`
  }
  const labels = { student: 'Student', staff: 'Staff', alumnus: 'Alumnus', other: 'Other' }
  return labels[user.category] || null
}

function categoryIcon(user) {
  const icons = { student: 'school', staff: 'work', alumnus: 'workspace_premium', other: 'person' }
  return icons[user?.category] || 'person'
}

function affiliationLabel(user) {
  if (user?.affiliation === 'mouau') return 'MOUAU'
  if (user?.affiliation === 'other') return 'Non-MOUAU'
  return null
}

function affiliationDetail(user) {
  if (user?.affiliation === 'mouau') {
    return user.department || 'Michael Okpara University of Agriculture'
  }
  if (user?.affiliation === 'other') {
    return user.institutionName || null
  }
  return null
}

function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleSignOut = async () => {
    await logout()
    navigate('/signin')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const category = categoryLabel(user)
  const affiliation = affiliationLabel(user)
  const detail = affiliationDetail(user)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Profile" />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <section className="flex flex-col items-center text-center pt-stack-md pb-stack-lg">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest border border-outline flex items-center justify-center mb-stack-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">person</span>
            )}
          </div>

          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">
            {user?.name || 'Student'}
          </h2>

          {user?.email && (
            <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">{user.email}</p>
          )}

          {(category || affiliation) && (
            <div className="flex items-stretch mt-stack-md rounded-lg border border-outline overflow-hidden w-full max-w-xs">
              {category && (
                <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {categoryIcon(user)}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface">{category}</span>
                </div>
              )}
              {category && affiliation && <div className="w-px bg-outline" />}
              {affiliation && (
                <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {user?.affiliation === 'mouau' ? 'account_balance' : 'public'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface">{affiliation}</span>
                </div>
              )}
            </div>
          )}

          {detail && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-stack-sm">{detail}</p>
          )}
        </section>

        <section className="flex flex-col gap-1 mb-stack-lg">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-4 py-stack-sm rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-primary">shield_person</span>
              <span className="font-body-md text-body-md text-primary font-semibold flex-grow text-left">
                Admin Console
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
            </button>
          )}

          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="flex items-center gap-4 py-stack-sm rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
              <span className="font-body-md text-body-md text-on-surface flex-grow text-left">{item.label}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
            </button>
          ))}
        </section>

        <button
          onClick={handleSignOut}
          className="w-full py-4 border border-outline text-error rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:bg-surface-container-low transition-all"
        >
          Sign Out
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

export default Profile