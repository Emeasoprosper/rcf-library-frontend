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
import { ChatsTab } from './WhatsAppChatsTab'

const TABS = [
  { key: 'groups', label: 'Groups', icon: 'groups' },
  { key: 'chats', label: 'Chats', icon: 'forum' },
  { key: 'settings', label: 'Settings', icon: 'tune' },
  { key: 'facts', label: 'RCF Facts', icon: 'verified' },
  { key: 'send', label: 'Send', icon: 'send' },
  { key: 'activity', label: 'Activity', icon: 'history' },
]

// Who a group is for: decides whether Bro Paul talks about past questions
// and lecture notes there (see rcf-library-backend/src/services/groupSettings.js).
const AUDIENCES = [
  { key: 'campus', icon: 'school', label: 'Campus students', hint: 'Full help: past questions, lecture notes and course materials.' },
  { key: 'mixed', icon: 'diversity_3', label: 'Mixed group', hint: 'Never brings up past questions. If asked, says "For MOUAU students, you can access these…".' },
  { key: 'general', icon: 'public', label: 'General, not students', hint: 'Never mentions past questions or lecture notes. Offers "resources for research" instead.' },
]

// What Bro Paul does while the group is praying together.
const PRAYER_MODES = [
  { key: 'quiet', icon: 'volume_off', label: 'Stay quiet', hint: 'Says nothing until prayer is over.' },
  { key: 'amen', icon: 'volunteer_activism', label: 'Amen with them', hint: 'Reacts 🙏 to the prayers and stays reverent.' },
  { key: 'join', icon: 'church', label: 'Pray along', hint: 'Also adds a short, sincere prayer now and then.' },
]

// Posts Bro Paul may send in a group.
const GROUP_POSTS = [
  { key: 'bookOfDay', label: 'Book of the day (12 noon)' },
  { key: 'morningPost', label: 'Bible verse of the day (morning)' },
  // Not set yet: on for student groups, off for 'general' ones (same as the bot).
  { key: 'studyTip', label: 'Study tip of the day (morning)', isOn: (s) => (typeof s.studyTip === 'boolean' ? s.studyTip : s.audience !== 'general') },
  { key: 'promos', label: 'Upload / library adverts' },
  { key: 'welcome', label: 'Welcome new members' },
  { key: 'chimeIn', label: 'Join conversations untagged' },
  { key: 'newMonth', label: 'Happy new month' },
  { key: 'birthdays', label: 'Birthday wishes' },
]

function GroupSettingsPanel({ group, saving, onChange, onIntroduce, introducing }) {
  const settings = group.settings || {}
  const revealAi = settings.revealAi !== false
  return (
    <div className="mt-3 pt-3 border-t border-outline flex flex-col gap-stack-sm">
      <button
        type="button"
        onClick={onIntroduce}
        disabled={introducing}
        className="rcf-press self-start flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-label-md text-label-md font-semibold disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]">waving_hand</span>
        {introducing ? 'Asked him to introduce himself…' : 'Introduce himself now'}
      </button>

      <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
        <span className="min-w-0">
          <span className="block font-body-md text-body-md text-on-surface">Say he's an AI</span>
          <span className="block font-label-sm text-label-sm text-on-surface-variant">
            {revealAi
              ? 'Introduces himself as the library\'s AI assistant.'
              : 'Introduces himself as Bro Paul from the Library Department. If someone sincerely asks, he still answers honestly.'}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={revealAi}
          disabled={saving}
          onClick={() => onChange({ revealAi: !revealAi })}
          className={`relative w-11 h-6 flex-none rounded-full transition-colors disabled:opacity-50 ${revealAi ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${revealAi ? 'translate-x-5' : ''}`} />
        </button>
      </label>

      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Who is this group for?</p>
      <div className="flex flex-col gap-1.5">
        {AUDIENCES.map((a) => {
          const active = (settings.audience || 'campus') === a.key
          return (
            <button
              key={a.key}
              type="button"
              disabled={saving}
              onClick={() => !active && onChange({ audience: a.key })}
              className={`text-left flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors disabled:opacity-60 ${
                active ? 'border-emerald-500 bg-emerald-500/10' : 'border-outline hover:border-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] flex-none ${active ? 'text-emerald-500' : 'text-on-surface-variant'}`}>{a.icon}</span>
              <span className="min-w-0">
                <span className="block font-label-md text-label-md text-on-surface">{a.label}</span>
                <span className="block font-label-sm text-label-sm text-on-surface-variant">{a.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-2">During prayer</p>
      <div className="grid grid-cols-3 gap-1.5">
        {PRAYER_MODES.map((p) => {
          const active = (settings.prayer || 'amen') === p.key
          return (
            <button
              key={p.key}
              type="button"
              disabled={saving}
              title={p.hint}
              onClick={() => !active && onChange({ prayer: p.key })}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-colors disabled:opacity-60 ${
                active ? 'border-emerald-500 bg-emerald-500/10' : 'border-outline hover:border-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${active ? 'text-emerald-500' : 'text-on-surface-variant'}`}>{p.icon}</span>
              <span className="font-label-sm text-label-sm text-on-surface leading-tight">{p.label}</span>
            </button>
          )
        })}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {PRAYER_MODES.find((p) => p.key === (settings.prayer || 'amen'))?.hint} No adverts, jokes or posts go out while a group is praying.
      </p>

      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-2">What can Bro Paul post here?</p>
      <div className="flex flex-col">
        {GROUP_POSTS.map((p) => {
          const on = p.isOn ? p.isOn(settings) : settings[p.key] !== false
          return (
            <label key={p.key} className="flex items-center justify-between gap-3 py-2 cursor-pointer">
              <span className="font-body-md text-body-md text-on-surface">{p.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={saving}
                onClick={() => onChange({ [p.key]: !on })}
                className={`relative w-11 h-6 flex-none rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          )
        })}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">Admin announcements still go to every switched-on group. Changes reach Bro Paul within a minute.</p>
    </div>
  )
}

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
  const [groupSearch, setGroupSearch] = useState('')
  const [copiedJid, setCopiedJid] = useState(null)
  const [openJid, setOpenJid] = useState(null)
  const [savingJid, setSavingJid] = useState(null)
  const [startingJid, setStartingJid] = useState(null)
  const [introduced, setIntroduced] = useState({}) // jid -> true once asked

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

  // Saves one change (e.g. { audience: 'general' } or { promos: false }).
  // Shown straight away, put back if the save fails.
  const handleGroupSettings = async (group, change) => {
    const before = group.settings
    const patch = (settings) =>
      setData((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.jid === group.jid ? { ...g, settings } : g)) }))
    patch({ ...before, ...change })
    setSavingJid(group.jid)
    try {
      const updated = await adminApi.saveWhatsappGroupSettings(group.jid, change)
      patch(updated.settings)
    } catch (err) {
      patch(before)
      setError(err.message || 'Could not save the group settings.')
    } finally {
      setSavingJid(null)
    }
  }

  // A new group: start Bro Paul there, introducing himself first or not.
  // An active group: introduce = he introduces himself again now.
  const handleStart = async (group, introduce) => {
    setStartingJid(group.jid)
    try {
      const updated = await adminApi.startWhatsappGroup(group.jid, introduce)
      setData((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.jid === group.jid ? { ...g, enabled: updated.enabled, settings: updated.settings } : g)),
      }))
      if (introduce) setIntroduced((prev) => ({ ...prev, [group.jid]: true }))
    } catch (err) {
      setError(err.message || 'Could not start Bro Paul in that group.')
    } finally {
      setStartingJid(null)
    }
  }

  // Group ID for ALLOWED_GROUP_JID and the bot logs; copied in full.
  const handleCopyJid = async (jid) => {
    try {
      await navigator.clipboard.writeText(jid)
      setCopiedJid(jid)
      setTimeout(() => setCopiedJid((c) => (c === jid ? null : c)), 1500)
    } catch {
      window.prompt('Copy the group ID:', jid)
    }
  }

  // Search by name or by any part of the group ID (as shown in the bot logs).
  const search = groupSearch.trim().toLowerCase()
  const matching = (data?.groups || []).filter(
    (g) => !search || (g.name || '').toLowerCase().includes(search) || g.jid.toLowerCase().includes(search)
  )
  // Just added: Bro Paul stays silent there until you introduce or start him.
  const newGroups = matching.filter((g) => g.settings?.started === false)
  const shownGroups = matching.filter((g) => g.settings?.started !== false)

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
        {tab === 'chats' && <ChatsTab />}

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

          {data && data.groups.length > 0 && (
            <label className="mb-stack-sm flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container border border-outline focus-within:border-emerald-500">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input
                type="search"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search by group name or ID"
                className="flex-grow min-w-0 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant"
              />
            </label>
          )}

          {data && data.groups.length > 0 && matching.length === 0 && (
            <p className="font-label-md text-label-md text-on-surface-variant mb-stack-sm">No group matches “{groupSearch}”.</p>
          )}

          {newGroups.length > 0 && (
            <div className="mb-stack-md">
              <h3 className="font-label-md text-label-md text-amber-500 uppercase tracking-wider mb-1">New groups • waiting for you</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm">
                Bro Paul was just added here and is staying silent. Set him up with ⚙️ after starting, or start him now.
              </p>
              <div className="flex flex-col gap-gutter">
                {newGroups.map((group) => (
                  <div key={group.jid} className="p-stack-md rounded-xl bg-amber-500/5 border border-amber-500/40">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-500">group_add</span>
                      <div className="min-w-0 flex-grow">
                        <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{group.name || 'Unnamed group'}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {group.member_count ? `${group.member_count} members • ` : ''}added {new Date(group.added_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={startingJid === group.jid}
                        onClick={() => handleStart(group, true)}
                        className="rcf-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-label-md text-label-md font-semibold disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">waving_hand</span>
                        Introduce &amp; start
                      </button>
                      <button
                        type="button"
                        disabled={startingJid === group.jid}
                        onClick={() => handleStart(group, false)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline text-on-surface font-label-md text-label-md disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        Start quietly
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newGroups.length > 0 && shownGroups.length > 0 && (
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">Groups he's in</h3>
          )}

          <div className="flex flex-col gap-gutter">
            {shownGroups.map((group) => (
              <div key={group.jid} className="p-stack-md rounded-xl bg-surface-container border border-outline">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">groups</span>
                <div className="min-w-0 flex-grow">
                  <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{group.name || 'Unnamed group'}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {AUDIENCES.find((a) => a.key === (group.settings?.audience || 'campus'))?.label} •{' '}
                    {group.member_count ? `${group.member_count} members • ` : ''}
                    added {new Date(group.added_at).toLocaleDateString()}
                    {group.enabled ? '' : ' • muted'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyJid(group.jid)}
                    title="Copy group ID"
                    className="mt-1 max-w-full flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="truncate font-mono">ID: {group.jid.split('@')[0]}</span>
                    <span className="material-symbols-outlined text-[14px] flex-none">{copiedJid === group.jid ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenJid((j) => (j === group.jid ? null : group.jid))}
                  aria-expanded={openJid === group.jid}
                  aria-label={`Settings for ${group.name || 'this group'}`}
                  className={`w-9 h-9 flex-none rounded-full flex items-center justify-center transition-colors ${
                    openJid === group.jid ? 'bg-emerald-500/15 text-emerald-500' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </button>
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
              {openJid === group.jid && (
                <GroupSettingsPanel
                  group={group}
                  saving={savingJid === group.jid}
                  onChange={(change) => handleGroupSettings(group, change)}
                  onIntroduce={() => handleStart(group, true)}
                  introducing={startingJid === group.jid || !!introduced[group.jid]}
                />
              )}
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
