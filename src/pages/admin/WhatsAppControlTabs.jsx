// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/WhatsAppControlTabs.jsx
// Bro Paul Control Center tabs (superadmin): Settings, RCF Facts, Send, Activity.
// The bot reloads settings and facts every minute, so nothing needs a redeploy.
import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline text-on-surface font-body-md focus:outline-none focus:border-primary'

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 flex-none rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-surface-container border border-outline p-stack-md ${className}`}>{children}</div>
}

function Note({ error, ok }) {
  if (error) return <p className="font-label-sm text-label-sm text-error mt-2">{error}</p>
  if (ok) return <p className="font-label-sm text-label-sm text-emerald-500 mt-2">{ok}</p>
  return null
}

const relTime = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// ---------- Settings ----------

const FEATURES = [
  { key: 'answerUntagged', icon: 'menu_book', title: 'Answer book requests without a tag', hint: '"Anyone has GST 101 past questions?" gets an answer even if nobody tags him.' },
  { key: 'chimeIn', icon: 'forum', title: 'Join lively discussions', hint: 'When the chat is busy, he may add something useful. At most once an hour per group.' },
  { key: 'welcomeNewMembers', icon: 'waving_hand', title: 'Welcome new members', hint: 'One friendly welcome when people are added to a group.' },
  { key: 'birthdayWishes', icon: 'cake', title: 'Birthday wishes', hint: 'Joins in when the group wishes someone happy birthday.' },
  { key: 'newMonthWishes', icon: 'calendar_month', title: 'Happy new month', hint: 'Posts a fresh new-month message on the 1st at 8am.' },
  { key: 'reactions', icon: 'favorite', title: '🤍 Reactions', hint: 'Hearts thanks, good news, birthday wishes and shared files, now and then.' },
]

const PROMO_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 24, label: 'Every day' },
  { value: 48, label: 'Every 2 days' },
  { value: 72, label: 'Every 3 days' },
  { value: 168, label: 'Every week' },
]

const hourLabel = (h) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`)

export function SettingsTab() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    adminApi.getWhatsappSettings().then((res) => setSettings(res.settings)).catch((err) => setError(err.message))
  }, [])

  const save = async (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    setError('')
    setOk('')
    try {
      const res = await adminApi.saveWhatsappSettings(next)
      setSettings(res.settings)
      setOk('Saved. Bro Paul picks it up within a minute.')
    } catch (err) {
      setError(err.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <Card><p className="text-on-surface-variant font-label-md">{error || 'Loading…'}</p></Card>

  return (
    <div className="flex flex-col gap-gutter">
      <Card className="flex flex-col divide-y divide-outline/60 p-0">
        {FEATURES.map((f) => (
          <div key={f.key} className="flex items-center gap-3 p-stack-md">
            <span className="material-symbols-outlined text-emerald-500">{f.icon}</span>
            <div className="min-w-0 flex-grow">
              <p className="font-body-md text-body-md font-semibold text-on-surface">{f.title}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{f.hint}</p>
            </div>
            <Switch checked={!!settings[f.key]} onChange={(v) => save({ [f.key]: v })} label={f.title} />
          </div>
        ))}
      </Card>

      <Card className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">"Upload to the library" adverts</span>
          <select value={settings.promoEveryHours} onChange={(e) => save({ promoEveryHours: Number(e.target.value) })} className={inputClass}>
            {PROMO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">AI answers per day (all groups)</span>
          <select value={settings.dailyAiLimit} onChange={(e) => save({ dailyAiLimit: Number(e.target.value) })} className={inputClass}>
            {[50, 100, 150, 250, 400, 600].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Posts on his own from</span>
          <select value={settings.activeFromHour} onChange={(e) => save({ activeFromHour: Number(e.target.value) })} className={inputClass}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Until</span>
          <select value={settings.activeToHour} onChange={(e) => save({ activeToHour: Number(e.target.value) })} className={inputClass}>
            {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </label>
        <p className="sm:col-span-2 font-label-sm text-label-sm text-on-surface-variant">
          Outside these hours he still answers people who talk to him, but never starts posts (adverts, announcements, welcomes) on his own. Lagos time.
        </p>
      </Card>
      {saving && <p className="font-label-sm text-label-sm text-on-surface-variant">Saving…</p>}
      <Note error={error} ok={ok} />
    </div>
  )
}

// ---------- RCF Facts ----------

const FACT_EXAMPLES = [
  { title: 'Sunday service', text: 'Sunday service holds at 8am at the RCF fellowship centre, behind the Faculty of Agriculture.' },
  { title: 'Bible study', text: 'Bible study is every Wednesday at 5pm.' },
]

export function FactsTab() {
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // fact id, or 'new'
  const [form, setForm] = useState({ title: '', text: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi.listWhatsappFacts().then((res) => setItems(res.items || [])).catch((err) => setError(err.message))
  }, [])

  const startEdit = (fact) => {
    setEditing(fact ? fact.id : 'new')
    setForm(fact ? { title: fact.title, text: fact.text } : { title: '', text: '' })
    setError('')
  }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      if (editing === 'new') {
        const created = await adminApi.addWhatsappFact(form)
        setItems((prev) => [...prev, created])
      } else {
        const updated = await adminApi.updateWhatsappFact(editing, form)
        setItems((prev) => prev.map((f) => (f.id === editing ? updated : f)))
      }
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (fact) => {
    if (!window.confirm(`Delete "${fact.title}"? Bro Paul will stop sharing it.`)) return
    try {
      await adminApi.deleteWhatsappFact(fact.id)
      setItems((prev) => prev.filter((f) => f.id !== fact.id))
    } catch (err) {
      setError(err.message || 'Could not delete.')
    }
  }

  const editor = (
    <Card className="flex flex-col gap-3 border-emerald-500/50">
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title, e.g. Sunday service" maxLength={80} className={inputClass} />
      <textarea
        rows={3}
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        placeholder="The information, e.g. Sunday service holds at 8am at the fellowship centre."
        maxLength={600}
        className={`${inputClass} resize-none`}
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-outline font-label-md text-label-md text-on-surface">Cancel</button>
        <button
          type="button"
          onClick={save}
          disabled={busy || !form.title.trim() || !form.text.trim()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save fact'}
        </button>
      </div>
    </Card>
  )

  return (
    <div className="flex flex-col gap-gutter">
      <Card className="bg-emerald-500/10 border-emerald-500/30">
        <p className="font-body-md text-body-md text-on-surface">
          These are the <b>only</b> RCF facts Bro Paul is allowed to state: service times, exco, events, contacts of departments. Anything not here, he says he doesn't have verified information and points people to an admin.
        </p>
      </Card>

      {items === null && <p className="text-on-surface-variant font-label-md">{error || 'Loading…'}</p>}

      {items?.length === 0 && editing !== 'new' && (
        <Card>
          <p className="font-label-md text-label-md text-on-surface-variant mb-2">No facts yet. Examples of what to add:</p>
          {FACT_EXAMPLES.map((ex) => (
            <p key={ex.title} className="font-label-sm text-label-sm text-on-surface-variant">• <b>{ex.title}:</b> {ex.text}</p>
          ))}
        </Card>
      )}

      {(items || []).map((fact) =>
        editing === fact.id ? (
          <div key={fact.id}>{editor}</div>
        ) : (
          <Card key={fact.id} className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-500 mt-0.5">verified</span>
            <div className="min-w-0 flex-grow">
              <p className="font-body-md text-body-md font-semibold text-on-surface">{fact.title}</p>
              <p className="font-label-md text-label-md text-on-surface-variant whitespace-pre-wrap">{fact.text}</p>
            </div>
            <button type="button" onClick={() => startEdit(fact)} aria-label={`Edit ${fact.title}`} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button type="button" onClick={() => remove(fact)} aria-label={`Delete ${fact.title}`} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </Card>
        )
      )}

      {editing === 'new' ? editor : (
        items && (
          <button type="button" onClick={() => startEdit(null)} className="rcf-press self-start flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add a fact
          </button>
        )
      )}
      <Note error={error} />
    </div>
  )
}

// ---------- Send as Bro Paul ----------

const OUTBOX_STATUS = {
  pending: { label: 'Waiting for Bro Paul…', className: 'text-amber-500' },
  sent: { label: 'Sent', className: 'text-emerald-500' },
  failed: { label: 'Failed', className: 'text-error' },
}

export function SendTab({ groups }) {
  const enabledGroups = groups.filter((g) => g.enabled)
  const [jid, setJid] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [outbox, setOutbox] = useState([])

  useEffect(() => {
    const load = () => adminApi.listWhatsappOutbox().then((res) => setOutbox(res.items || [])).catch(() => {})
    load()
    const timer = setInterval(load, 8000)
    return () => clearInterval(timer)
  }, [])

  const target = jid || enabledGroups[0]?.jid || ''

  const send = async () => {
    setSending(true)
    setError('')
    try {
      const row = await adminApi.sendWhatsappMessage(target, text)
      const group = groups.find((g) => g.jid === target)
      setOutbox((prev) => [{ ...row, group_jid: target, group_name: group?.name, text }, ...prev])
      setText('')
    } catch (err) {
      setError(err.message || 'Could not send.')
    } finally {
      setSending(false)
    }
  }

  if (enabledGroups.length === 0) {
    return <Card><p className="font-label-md text-label-md text-on-surface-variant">Bro Paul isn't active in any group yet.</p></Card>
  }

  return (
    <div className="flex flex-col gap-gutter">
      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Group</span>
          <select value={target} onChange={(e) => setJid(e.target.value)} className={inputClass}>
            {enabledGroups.map((g) => <option key={g.jid} value={g.jid}>{g.name || 'Unnamed group'}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Message (posted exactly as you type it, *bold* works)</span>
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} placeholder="Hello everyone! 👋" className={`${inputClass} resize-none`} />
        </label>
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="rcf-press self-end flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          {sending ? 'Queuing…' : 'Send as Bro Paul'}
        </button>
        <p className="font-label-sm text-label-sm text-on-surface-variant">He posts it within about 20 seconds.</p>
        <Note error={error} />
      </Card>

      {outbox.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Recent</h3>
          {outbox.map((o) => {
            const st = OUTBOX_STATUS[o.status] || OUTBOX_STATUS.pending
            return (
              <Card key={o.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{o.group_name || 'Group'} • {relTime(o.created_at)}</span>
                  <span className={`font-label-sm text-label-sm flex-none ${st.className}`}>{st.label}</span>
                </div>
                <p className="font-label-md text-label-md text-on-surface mt-1 line-clamp-2 whitespace-pre-wrap">{o.text}</p>
                {o.error && <p className="font-label-sm text-label-sm text-error mt-1">{o.error}</p>}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Activity ----------

const KIND = {
  reply: { icon: 'chat', color: 'text-blue-500', label: 'Reply' },
  search: { icon: 'search', color: 'text-violet-500', label: 'Library search' },
  chime: { icon: 'forum', color: 'text-teal-500', label: 'Joined discussion' },
  birthday: { icon: 'cake', color: 'text-pink-500', label: 'Birthday wish' },
  'new-month': { icon: 'calendar_month', color: 'text-teal-500', label: 'New month' },
  promo: { icon: 'campaign', color: 'text-orange-500', label: 'Upload advert' },
  announcement: { icon: 'notifications', color: 'text-amber-500', label: 'Announcement' },
  welcome: { icon: 'waving_hand', color: 'text-emerald-500', label: 'Welcome' },
  react: { icon: 'favorite', color: 'text-pink-400', label: 'Reaction' },
  send: { icon: 'send', color: 'text-[#25D366]', label: 'Admin message' },
}

export function ActivityTab() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    const load = () => adminApi.listWhatsappActivity().then((res) => setItems(res.items || [])).catch(() => setItems((p) => p || []))
    load()
    const timer = setInterval(load, 20000)
    return () => clearInterval(timer)
  }, [])

  if (items === null) return <p className="text-on-surface-variant font-label-md">Loading…</p>
  if (items.length === 0) {
    return <Card><p className="font-label-md text-label-md text-on-surface-variant">Nothing yet. Activity shows up here within a minute of Bro Paul doing something.</p></Card>
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((a) => {
        const k = KIND[a.kind] || { icon: 'bolt', color: 'text-on-surface-variant', label: a.kind }
        return (
          <Card key={a.id} className="py-3 flex items-start gap-3">
            <span className={`material-symbols-outlined ${k.color} mt-0.5`}>{k.icon}</span>
            <div className="min-w-0 flex-grow">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md font-semibold text-on-surface">{k.label}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex-none">{relTime(a.created_at)}</span>
              </div>
              {a.group_name && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{a.group_name}</p>}
              <p className="font-label-md text-label-md text-on-surface-variant mt-0.5 line-clamp-3">{a.summary}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
