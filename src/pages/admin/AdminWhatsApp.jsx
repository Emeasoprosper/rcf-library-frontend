// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminWhatsApp.jsx
// Superadmin only: link the WhatsApp bot (Bro Paul) by scanning a QR,
// see if he's online, and switch groups on/off.
import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { SettingsTab, FactsTab, SendTab, ActivityTab } from './WhatsAppControlTabs'

const TABS = [
  { key: 'groups', label: 'Groups', icon: 'groups' },
  { key: 'settings', label: 'Settings', icon: 'tune' },
  { key: 'facts', label: 'RCF Facts', icon: 'verified' },
  { key: 'send', label: 'Send', icon: 'send' },
  { key: 'activity', label: 'Activity', icon: 'history' },
]

const stateConfig = {
  online: { label: 'Online', dot: 'bg-emerald-500', text: 'Bro Paul is connected and chatting.' },
  qr: { label: 'Waiting for scan', dot: 'bg-amber-500 animate-pulse', text: 'Scan the QR below with the bot phone.' },
  connecting: { label: 'Connecting', dot: 'bg-blue-500 animate-pulse', text: 'Bro Paul is starting up…' },
  offline: { label: 'Offline', dot: 'bg-red-500', text: 'The bot server is not running. Start it on the server or your PC.' },
}

function AdminWhatsApp() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [relinking, setRelinking] = useState(false)
  const [togglingJid, setTogglingJid] = useState(null)
  const [tab, setTab] = useState('groups')

  const load = useCallback(
    () =>
      adminApi
        .getWhatsappBot()
        .then((res) => {
          setData(res)
          setError('')
        })
        .catch((err) => setError(err.message || 'Could not load the bot status.')),
    []
  )

  // QR codes expire every ~20s, so refresh fast while one is showing.
  const fast = data?.state === 'qr' || data?.state === 'connecting' || data?.relinkRequested
  useEffect(() => {
    const first = setTimeout(load, 0)
    const timer = setInterval(load, fast ? 3000 : 15000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [load, fast])

  if (user && user.role !== 'superadmin') return <Navigate to="/admin" replace />

  const handleRelink = async () => {
    if (!window.confirm('Log Bro Paul out of the current WhatsApp number and show a new QR code?')) return
    setRelinking(true)
    try {
      await adminApi.relinkWhatsappBot()
      await load()
    } catch (err) {
      setError(err.message || 'Could not request a new QR.')
    } finally {
      setRelinking(false)
    }
  }

  const handleToggleGroup = async (group) => {
    setTogglingJid(group.jid)
    try {
      const updated = await adminApi.setWhatsappGroup(group.jid, !group.enabled)
      setData((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.jid === group.jid ? { ...g, enabled: updated.enabled } : g)),
      }))
    } catch (err) {
      setError(err.message || 'Could not update the group.')
    } finally {
      setTogglingJid(null)
    }
  }

  const status = stateConfig[data?.state] || stateConfig.offline

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="WhatsApp Bot" showBack />

      <main className="pb-32 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile flex flex-col gap-stack-lg">
        {error && (
          <div className="p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        <section className="rounded-2xl border border-outline bg-gradient-to-br from-emerald-500/10 via-surface-container to-green-500/10 p-stack-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-white text-[26px]">smart_toy</span>
            </div>
            <div className="min-w-0 flex-grow">
              <p className="font-body-md text-body-md font-semibold text-on-surface">Bro Paul</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${status.dot}`} />
                {data ? status.label : 'Loading…'}
                {data?.phone && data.state === 'online' ? ` • +${data.phone}` : ''}
              </p>
            </div>
          </div>
          {data && <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">{status.text}</p>}

          {data?.state === 'qr' && data.qrDataUrl && (
            <div className="mt-stack-md flex flex-col items-center gap-3">
              <img
                src={data.qrDataUrl}
                alt="WhatsApp link QR code"
                className="w-full max-w-[320px] aspect-square rounded-xl bg-white p-2 border border-outline"
              />
              <ol className="font-label-sm text-label-sm text-on-surface-variant list-decimal pl-5 self-start">
                <li>On the bot phone, open WhatsApp (the Airtel number).</li>
                <li>Tap ⋮ → Linked devices → Link a device.</li>
                <li>Point the camera at this code. It refreshes by itself.</li>
              </ol>
            </div>
          )}

          {data?.relinkRequested && data.state !== 'qr' && (
            <p className="font-label-sm text-label-sm text-primary mt-3">New QR requested. It will appear here in a few seconds…</p>
          )}

          {data?.state === 'online' && (
            <button
              onClick={handleRelink}
              disabled={relinking || data.relinkRequested}
              className="mt-stack-md w-full py-3 rounded-lg font-label-md text-label-md bg-surface-container border border-outline text-on-surface hover:border-on-surface-variant transition-colors disabled:opacity-50"
            >
              {relinking ? 'Requesting…' : 'Link a different number (new QR)'}
            </button>
          )}
        </section>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Bro Paul Control Center">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rcf-press flex-none flex items-center gap-1.5 px-4 py-2.5 rounded-full font-label-md text-label-md transition-colors ${
                tab === t.key ? 'bg-emerald-500 text-white shadow-md' : 'bg-surface-container border border-outline text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'settings' && <SettingsTab />}
        {tab === 'facts' && <FactsTab />}
        {tab === 'send' && <SendTab groups={data?.groups || []} />}
        {tab === 'activity' && <ActivityTab />}

        {tab === 'groups' && (
        <section>
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            Groups
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm">
            When someone adds Bro Paul to a group he starts chatting there automatically and you get a notification. Switch a group off to make him go quiet there.
          </p>

          {data && data.groups.length === 0 && (
            <div className="p-stack-md rounded-xl bg-surface-container border border-outline">
              <p className="font-label-md text-label-md text-on-surface-variant">No groups yet. Add the bot number to a WhatsApp group.</p>
            </div>
          )}

          <div className="flex flex-col gap-gutter">
            {(data?.groups || []).map((group) => (
              <div key={group.jid} className="p-stack-md rounded-xl bg-surface-container border border-outline flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">groups</span>
                <div className="min-w-0 flex-grow">
                  <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{group.name || 'Unnamed group'}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {group.member_count ? `${group.member_count} members • ` : ''}
                    added {new Date(group.added_at).toLocaleDateString()}
                    {group.enabled ? '' : ' • muted'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={group.enabled}
                  aria-label={`Bro Paul active in ${group.name || 'this group'}`}
                  disabled={togglingJid === group.jid}
                  onClick={() => handleToggleGroup(group)}
                  className={`relative w-12 h-7 flex-none rounded-full transition-colors disabled:opacity-50 ${
                    group.enabled ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${group.enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </section>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminWhatsApp
