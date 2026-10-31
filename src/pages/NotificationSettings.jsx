// student-dashboard/src/pages/NotificationSettings.jsx
import { useState, useEffect } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { communityApi } from '../services/api'
import { getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from '../lib/pushNotifications'

const OPTIONS = [
  { key: 'daily', icon: 'auto_awesome', title: 'Verse of the day', hint: 'A Bible verse and a study tip every morning at 7am.' },
  { key: 'resources', icon: 'library_add', title: 'New resources', hint: 'When new books, videos or past questions are added.' },
  { key: 'news', icon: 'newspaper', title: 'News', hint: 'News posted by the library team.' },
  { key: 'announcements', icon: 'campaign', title: 'Announcements', hint: 'Important notices from the admins.' },
  { key: 'updates', icon: 'mark_email_unread', title: 'My submissions and requests', hint: 'When an admin approves or rejects your upload, or answers your request.' },
  { key: 'birthday', icon: 'cake', title: 'Birthday wishes', hint: 'A birthday message from RCF Library on your day.' },
]

function Switch({ on, onClick, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative w-12 h-7 flex-none rounded-full transition-colors ${
        on ? 'bg-orange-500' : 'bg-surface-container-highest border border-outline'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

function NotificationSettings() {
  const [status, setStatus] = useState('loading')
  const [prefs, setPrefs] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const denied = typeof Notification !== 'undefined' && Notification.permission === 'denied'

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus).catch(() => setStatus('unsupported'))
    communityApi
      .pushPreferences()
      .then((res) => setPrefs(res.prefs))
      .catch(() => setError('Could not load your notification choices.'))
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    setError('')
    try {
      await subscribeToPush()
      setStatus('subscribed')
    } catch (err) {
      setError(err.message || 'Could not turn on notifications.')
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    setError('')
    try {
      await unsubscribeFromPush()
      setStatus('unsubscribed')
    } catch (err) {
      setError(err.message || 'Could not turn off notifications.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (key) => {
    if (!prefs) return
    const previous = prefs
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    try {
      await communityApi.savePushPreferences(next)
    } catch (err) {
      setPrefs(previous)
      setError(err.message || 'Could not save that choice.')
    }
  }

  const [testMsg, setTestMsg] = useState('')
  const handleTest = async () => {
    setTestMsg('Sending…')
    try {
      const res = await communityApi.testPush()
      setTestMsg(res.sent > 0 ? 'Sent. Check your notification bar.' : 'The push service did not accept it. Check the Render logs.')
    } catch (err) {
      setTestMsg(err.message || 'Could not send the test.')
    }
  }

  const on = status === 'subscribed'

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Notifications" showBack />

      <main className="pb-24 pt-[68px] md:pt-36 md:max-w-2xl md:mx-auto px-margin-mobile">
        {status === 'loading' && <LibraryLoader size={100} fullScreen />}

        <section className="relative overflow-hidden rounded-2xl border border-outline bg-gradient-to-br from-orange-500/15 via-surface-container to-surface-container p-5 mb-stack-md">
          <div className="flex items-start gap-4">
            <div className="flex-none w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="material-symbols-outlined text-[26px]">{on ? 'notifications_active' : 'notifications'}</span>
            </div>
            <div className="min-w-0 flex-grow">
              <h1 className="font-headline-md text-headline-md font-display text-on-surface">Phone notifications</h1>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                {on
                  ? 'On for this device. They arrive like WhatsApp, even when the app is closed.'
                  : 'Get new resources, news and updates on your phone, even when the app is closed.'}
              </p>
            </div>
          </div>

          {status === 'unsupported' && (
            <p className="mt-4 font-label-md text-label-md text-on-surface-variant">
              This browser or device does not support notifications. On iPhone, add the app to your home screen first.
            </p>
          )}

          {denied && status !== 'unsupported' && (
            <p className="mt-4 font-label-md text-label-md text-error">
              Notifications are blocked for this site. Allow them in your browser or phone site settings, then come back.
            </p>
          )}

          {(status === 'unsubscribed' || status === 'subscribed') && !denied && (
            <button
              onClick={on ? handleDisable : handleEnable}
              disabled={busy}
              className={`mt-4 w-full h-12 rounded-xl font-label-md text-label-md font-semibold transition-transform ${
                on
                  ? 'bg-surface-container border border-outline text-on-surface'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
              } ${busy ? 'opacity-60 cursor-wait' : 'active:scale-[0.98]'}`}
            >
              {busy ? 'Please wait…' : on ? 'Turn off on this device' : 'Turn on notifications'}
            </button>
          )}
        </section>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {on && (
          <div className="mb-stack-md">
            <button
              onClick={handleTest}
              className="w-full h-12 rounded-xl bg-surface-container border border-outline font-label-md text-label-md text-on-surface active:scale-[0.98] transition-transform"
            >
              Send me a test notification
            </button>
            {testMsg && <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{testMsg}</p>}
          </div>
        )}

        <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
          What do you want to hear about?
        </h2>
        <div className="flex flex-col gap-gutter">
          {OPTIONS.map((o) => (
            <div key={o.key} className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline">
              <div className="flex-none w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">{o.icon}</span>
              </div>
              <div className="min-w-0 flex-grow">
                <p className="font-body-md text-body-md font-semibold text-on-surface">{o.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{o.hint}</p>
              </div>
              <Switch on={Boolean(prefs?.[o.key])} onClick={() => toggle(o.key)} label={o.title} />
            </div>
          ))}
        </div>
        <p className="mt-stack-md font-label-sm text-label-sm text-on-surface-variant">
          These choices apply to all your devices.
        </p>
      </main>

      <BottomNav />
    </div>
  )
}

export default NotificationSettings