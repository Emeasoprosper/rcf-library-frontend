import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'

const quickLinks = [
  { to: '/admin/uploads', icon: 'upload', label: 'Review Uploads', gradient: 'from-blue-500 to-cyan-400' },
  { to: '/admin/resources', icon: 'folder_managed', label: 'Manage Resources', gradient: 'from-emerald-500 to-teal-400' },
  { to: '/admin/requests', icon: 'inbox', label: 'Open Requests', gradient: 'from-amber-500 to-orange-400' },
  { to: '/admin/users', icon: 'group', label: 'Manage Users', gradient: 'from-violet-500 to-purple-400' },
  { to: '/admin/announcements', icon: 'campaign', label: 'Announce / News', gradient: 'from-pink-500 to-rose-400' },
]

const statGradients = {
  'Total Users': 'from-violet-500 to-purple-400',
  Resources: 'from-emerald-500 to-teal-400',
  Downloads: 'from-blue-500 to-cyan-400',
  'Pending Review': 'from-amber-500 to-orange-400',
}

// Where each stat card should navigate when tapped. Downloads has no
// dedicated admin report page yet, so it links to Manage Resources
// (the closest existing view) rather than a dead route.
const statLinks = {
  'Total Users': '/admin/users',
  Resources: '/admin/resources',
  Downloads: '/admin/resources',
  'Pending Review': '/admin/uploads',
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setStats)
      .catch((err) => setError(err.message || 'Could not load dashboard stats.'))
  }, [])

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: 'group' },
        { label: 'Resources', value: stats.totalResources.toLocaleString(), icon: 'book' },
        { label: 'Downloads', value: stats.totalDownloads.toLocaleString(), icon: 'download' },
        { label: 'Pending Review', value: stats.pendingReview.toLocaleString(), icon: 'pending_actions' },
      ]
    : []

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Admin Console" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        {error && (
          <div className="mb-stack-lg p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {!stats && !error && (
          <div className="flex justify-center py-stack-lg">
            <LibraryLoader size={80} />
          </div>
        )}

        {stats && (
          <section className="grid grid-cols-2 gap-gutter mb-stack-lg">
            {statCards.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(statLinks[stat.label])}
                className="text-left p-stack-md rounded-xl bg-surface-container border border-outline hover:border-on-surface-variant transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${statGradients[stat.label]} flex items-center justify-center mb-2`}>
                  <span className="material-symbols-outlined text-white text-[18px]">{stat.icon}</span>
                </div>
                <p className="font-headline-lg text-headline-lg font-display text-on-surface">{stat.value}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{stat.label}</p>
              </button>
            ))}
          </section>
        )}

        <section className="grid grid-cols-2 gap-gutter mb-stack-lg">
          {quickLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="flex flex-col items-start gap-2 p-stack-md rounded-xl bg-surface-container border border-outline hover:border-on-surface-variant transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-[18px]">{link.icon}</span>
              </div>
              <span className="font-body-md text-body-md font-semibold text-on-surface">{link.label}</span>
              {link.to === '/admin/uploads' && stats?.pendingReview > 0 && (
                <span className="text-label-sm font-label-sm text-primary">{stats.pendingReview} waiting</span>
              )}
              {link.to === '/admin/requests' && stats?.openRequests > 0 && (
                <span className="text-label-sm font-label-sm text-primary">{stats.openRequests} waiting</span>
              )}
              {link.to === '/admin/requests' && stats?.openRequests > 0 && (
                <span className="text-label-sm font-label-sm text-primary">{stats.openRequests} waiting</span>
              )}
            </button>
          ))}
        </section>

        <section>
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            System Status
          </h2>
          <div className="flex items-center gap-3 p-stack-md rounded-xl bg-surface-container border border-outline">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-error' : 'bg-primary'}`} />
            <p className="font-body-md text-body-md text-on-surface">
              {error ? 'Having trouble reaching the API' : 'All services operational'}
            </p>
          </div>
        </section>
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminDashboard