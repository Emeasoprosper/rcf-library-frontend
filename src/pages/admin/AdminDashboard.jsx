import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi, presenceApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useActiveResource } from '../../contexts/ActiveResourceContext'
import { usePresence } from '../../contexts/PresenceContext'

const quickLinks = [
  { to: '/admin/uploads', icon: 'upload', label: 'Review Uploads', gradient: 'from-blue-500 to-cyan-400' },
  { to: '/admin/resources', icon: 'folder_managed', label: 'Manage Resources', gradient: 'from-emerald-500 to-teal-400' },
  { to: '/admin/organize', icon: 'library_books', label: 'Collections', gradient: 'from-violet-500 to-purple-400' },
  { to: '/admin/home-rails', icon: 'view_carousel', label: 'Home Rails', gradient: 'from-cyan-500 to-blue-400' },
  { to: '/admin/requests', icon: 'inbox', label: 'Open Requests', gradient: 'from-amber-500 to-orange-400' },
  { to: '/admin/users', icon: 'group', label: 'Manage Users', gradient: 'from-violet-500 to-purple-400' },
  { to: '/admin/announcements', icon: 'campaign', label: 'Announce / News', gradient: 'from-pink-500 to-rose-400' },
  { to: '/admin/analytics', icon: 'bar_chart', label: 'Analytics', gradient: 'from-orange-500 to-amber-400' },
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
  const { user } = useAuth()
  const { openInspector } = useActiveResource()
  const [loadingErrors, setLoadingErrors] = useState(false)
  const presence = usePresence()
  const [savingIndicator, setSavingIndicator] = useState(false)
  const [indicatorError, setIndicatorError] = useState('')
  const [savingStudy, setSavingStudy] = useState(false)
  const [studyError, setStudyError] = useState('')

  async function toggleStudySpace() {
    if (!presence) return
    setSavingStudy(true)
    setStudyError('')
    try {
      await presenceApi.setStudyEnabled(!presence.studyEnabled)
      await presence.refresh()
    } catch (err) {
      setStudyError(err.message || 'Could not change the Study space switch.')
    } finally {
      setSavingStudy(false)
    }
  }

  async function toggleOnlineIndicator() {
    if (!presence) return
    setSavingIndicator(true)
    setIndicatorError('')
    try {
      await presenceApi.setEnabled(!presence.enabled)
      await presence.refresh()
    } catch (err) {
      setIndicatorError(err.message || 'Could not change the online indicator.')
    } finally {
      setSavingIndicator(false)
    }
  }

  async function viewServerErrors() {
    setLoadingErrors(true)
    try {
      const { items } = await adminApi.systemErrors()
      openInspector({
        title: 'Server errors',
        text: items.length
          ? items.map((e) => `[${new Date(e.at).toLocaleString()}]\n${e.message}`).join('\n\n----------\n\n')
          : 'No errors logged since the server last started.',
      })
    } catch (err) {
      openInspector({ title: 'Server errors', text: err.message || 'Could not load server errors.' })
    } finally {
      setLoadingErrors(false)
    }
  }
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
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Admin Console" showBack />

      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-5xl md:mx-auto px-margin-mobile">
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
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
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

        <section className="grid grid-cols-2 xl:grid-cols-3 gap-gutter mb-stack-lg">
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

        <section className="mt-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            Online Indicator
          </h2>
          <div className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline">
            <div className="flex-grow min-w-0">
              <p className="font-body-md text-body-md font-semibold text-on-surface">
                Show people online to everyone
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {presence?.online != null ? `${presence.online} online right now. ` : ''}
                Admins always see it in the admin panel, whatever this is set to.
              </p>
              {indicatorError && (
                <p className="font-label-sm text-label-sm text-error mt-1">{indicatorError}</p>
              )}
            </div>
            <button
              role="switch"
              aria-checked={Boolean(presence?.enabled)}
              onClick={toggleOnlineIndicator}
              disabled={!presence || savingIndicator}
              className={`relative w-12 h-7 flex-none rounded-full transition-colors disabled:opacity-50 ${
                presence?.enabled ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  presence?.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </section>

        <section className="mt-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            Study Space
          </h2>
          <div className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline">
            <div className="flex-grow min-w-0">
              <p className="font-body-md text-body-md font-semibold text-on-surface">
                Show Study space to students
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Hidden from students while you finish it. Admins always see it, whatever this is set to.
              </p>
              {studyError && (
                <p className="font-label-sm text-label-sm text-error mt-1">{studyError}</p>
              )}
            </div>
            <button
              role="switch"
              aria-checked={Boolean(presence?.studyEnabled)}
              onClick={toggleStudySpace}
              disabled={!presence || savingStudy}
              className={`relative w-12 h-7 flex-none rounded-full transition-colors disabled:opacity-50 ${
                presence?.studyEnabled ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  presence?.studyEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </section>

        {user?.role === 'superadmin' && (
          <button
            onClick={viewServerErrors}
            disabled={loadingErrors}
            className="hidden lg:flex mt-stack-md w-full items-center gap-3 p-stack-md rounded-xl bg-surface-container border border-outline hover:border-on-surface-variant transition-colors text-left disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
            <span className="font-body-md text-body-md text-on-surface">
              {loadingErrors ? 'Loading…' : 'View server errors'}
            </span>
          </button>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminDashboard