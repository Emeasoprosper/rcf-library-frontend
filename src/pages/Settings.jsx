import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import ToggleSwitch from '../components/ui/ToggleSwitch'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

const languages = ['English']

function Settings() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [openSection, setOpenSection] = useState(null)

  const [profileDraft, setProfileDraft] = useState({ name: '', bio: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Sync draft with real user data once it loads/changes.
  useEffect(() => {
    if (user) {
      setProfileDraft({ name: user.name || '', bio: user.bio || '' })
    }
  }, [user])

  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    newResources: true,
  })

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showHistory: false,
  })

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key)
  }

  const saveProfile = async () => {
    if (!profileDraft.name.trim()) {
      setProfileError('Name is required.')
      return
    }
    setProfileError('')
    setSavingProfile(true)
    try {
      await authApi.updateMe({ name: profileDraft.name.trim(), bio: profileDraft.bio.trim() })
      await refreshUser()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      setProfileError(err.message || 'Failed to save. Try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Settings" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <section className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            Account
          </h2>
          <div className="rounded-xl bg-surface-container border border-outline overflow-hidden">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center gap-4 p-stack-md text-left"
            >
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
              <span className="font-body-md text-body-md text-on-surface flex-grow">Edit Profile</span>
              <span
                className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${
                  openSection === 'profile' ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>
            {openSection === 'profile' && (
              <div className="px-stack-md pb-stack-md flex flex-col gap-stack-md border-t border-outline/30 pt-stack-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Name</label>
                  <input
                    type="text"
                    value={profileDraft.name}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Bio</label>
                  <textarea
                    rows={2}
                    value={profileDraft.bio}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-none"
                  />
                </div>
                {profileError && (
                  <p className="font-label-sm text-label-sm text-error">{profileError}</p>
                )}
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="self-start px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md active:scale-[0.98] hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : profileSaved ? 'Saved' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            Preferences
          </h2>
          <div className="flex flex-col gap-gutter">
            <div className="rounded-xl bg-surface-container border border-outline overflow-hidden">
              <button
                onClick={() => toggleSection('notifications')}
                className="w-full flex items-center gap-4 p-stack-md text-left"
              >
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                <span className="font-body-md text-body-md text-on-surface flex-grow">Notification Preferences</span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${
                    openSection === 'notifications' ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openSection === 'notifications' && (
                <div className="px-stack-md pb-stack-md flex flex-col gap-4 border-t border-outline/30 pt-stack-md">
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">Push Notifications</span>
                    <ToggleSwitch
                      checked={notifications.push}
                      onChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
                      label="Push Notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">Email Updates</span>
                    <ToggleSwitch
                      checked={notifications.email}
                      onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
                      label="Email Updates"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">New Resource Alerts</span>
                    <ToggleSwitch
                      checked={notifications.newResources}
                      onChange={(v) => setNotifications((n) => ({ ...n, newResources: v }))}
                      label="New Resource Alerts"
                    />
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant pt-2 border-t border-outline/30">
                    These toggles aren't wired to the backend yet — no notification-preferences
                    table or route exists. Changes here won't persist on refresh.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-surface-container border border-outline overflow-hidden">
              <button
                onClick={() => toggleSection('privacy')}
                className="w-full flex items-center gap-4 p-stack-md text-left"
              >
                <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                <span className="font-body-md text-body-md text-on-surface flex-grow">Privacy & Security</span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${
                    openSection === 'privacy' ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openSection === 'privacy' && (
                <div className="px-stack-md pb-stack-md flex flex-col gap-4 border-t border-outline/30 pt-stack-md">
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">Show Profile to Others</span>
                    <ToggleSwitch
                      checked={privacy.showProfile}
                      onChange={(v) => setPrivacy((p) => ({ ...p, showProfile: v }))}
                      label="Show Profile to Others"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">Show Reading History</span>
                    <ToggleSwitch
                      checked={privacy.showHistory}
                      onChange={(v) => setPrivacy((p) => ({ ...p, showHistory: v }))}
                      label="Show Reading History"
                    />
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant pt-2 border-t border-outline/30">
                    show_profile/show_history columns already exist in the users table but this
                    page doesn't call a save route yet — same situation as the toggles above.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-surface-container border border-outline overflow-hidden">
              <button
                onClick={() => toggleSection('language')}
                className="w-full flex items-center gap-4 p-stack-md text-left"
              >
                <span className="material-symbols-outlined text-on-surface-variant">language</span>
                <span className="font-body-md text-body-md text-on-surface flex-grow">Language</span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${
                    openSection === 'language' ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openSection === 'language' && (
                <div className="px-stack-md pb-stack-md border-t border-outline/30 pt-stack-md">
                  {languages.map((lang) => (
                    <div key={lang} className="flex items-center justify-between py-2">
                      <span className="font-body-md text-body-md text-on-surface">{lang}</span>
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    </div>
                  ))}
                  <p className="font-label-sm text-label-sm text-on-surface-variant pt-2">
                    More languages coming soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            About
          </h2>
          <div className="flex flex-col gap-gutter">
            <button
              onClick={() => navigate('/help')}
              className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline text-left"
            >
              <span className="material-symbols-outlined text-on-surface-variant">help</span>
              <span className="font-body-md text-body-md text-on-surface flex-grow">Help & Support</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
            </button>

            <div className="rounded-xl bg-surface-container border border-outline overflow-hidden">
              <button
                onClick={() => toggleSection('about')}
                className="w-full flex items-center gap-4 p-stack-md text-left"
              >
                <span className="material-symbols-outlined text-on-surface-variant">info</span>
                <span className="font-body-md text-body-md text-on-surface flex-grow">About</span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform ${
                    openSection === 'about' ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openSection === 'about' && (
                <div className="px-stack-md pb-stack-md border-t border-outline/30 pt-stack-md flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">Version</span>
                    <span className="font-body-md text-body-md text-on-surface">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">Developed for</span>
                    <span className="font-body-md text-body-md text-on-surface">RCF MOUAU Chapter</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

export default Settings