// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/WhatsAppChatsTab.jsx
// Bro Paul Control Center > Chats (superadmin): saved conversations with the
// bot (every private chat, and in groups the messages he answered plus his
// own posts), shown as chat bubbles. Also the chat log's storage: how full it
// is, a zip download of everything, and deleting old chats.
import { useCallback, useEffect, useRef, useState } from 'react'
import { adminApi } from '../../services/api'

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'group', label: 'Groups' },
  { key: 'private', label: 'Private' },
]

const KIND_LABEL = { voice: '🎤 Voice note', image: '🖼️ Image', sticker: 'Sticker', post: 'Post' }

const fmtBytes = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

const fmtTime = (iso) => {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// A private chat id is the person's number (or a WhatsApp @lid id).
const chatLabel = (c) => c.name || (c.chat_type === 'private' ? `+${c.chat_jid.split('@')[0]}` : 'Unnamed group')

function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-surface-container border border-outline p-stack-md ${className}`}>{children}</div>
}

function StorageCard({ storage, onExport, exporting, onDeleteAll }) {
  if (!storage) return null
  const pct = Math.min(100, storage.percent)
  const bar = pct >= 100 ? 'bg-error' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-label-md text-label-md text-on-surface font-semibold">Chat storage</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {fmtBytes(storage.usedBytes)} of {fmtBytes(storage.limitBytes)} • {storage.rows.toLocaleString()} messages
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
        <div className={`h-full ${bar} transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {!storage.saveChats
          ? 'Saving chats is switched off in Settings.'
          : storage.autoDelete
            ? 'You get a notification at 80%. When full, the oldest messages are deleted automatically.'
            : 'You get a notification at 80%. When full, new messages stop being saved until you clear some.'}{' '}
        Change this in Settings.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || storage.rows === 0}
          className="rcf-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {exporting ? 'Preparing…' : 'Download all (zip)'}
        </button>
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={storage.rows === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline text-on-surface-variant hover:text-error font-label-md text-label-md disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          Delete all
        </button>
      </div>
    </Card>
  )
}

function Conversation({ chat, onBack, onDeleted }) {
  const [items, setItems] = useState(null)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    adminApi
      .getWhatsappChatMessages(chat.chat_jid)
      .then((res) => {
        setItems(res.items || [])
        setMore(!!res.more)
        setTimeout(() => endRef.current?.scrollIntoView({ block: 'end' }), 0)
      })
      .catch((err) => setError(err.message || 'Could not load this chat.'))
  }, [chat.chat_jid])

  const loadOlder = async () => {
    try {
      const res = await adminApi.getWhatsappChatMessages(chat.chat_jid, items[0]?.id)
      setItems((prev) => [...(res.items || []), ...prev])
      setMore(!!res.more)
    } catch (err) {
      setError(err.message || 'Could not load older messages.')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete the saved chat with ${chatLabel(chat)}? This can't be undone.`)) return
    try {
      await adminApi.deleteWhatsappChat(chat.chat_jid)
      onDeleted()
    } catch (err) {
      setError(err.message || 'Could not delete.')
    }
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Back to chats" className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="min-w-0 flex-grow">
          <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{chatLabel(chat)}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{chat.chat_type === 'private' ? 'Private chat' : 'Group'} • {chat.count} messages</p>
        </div>
        <button type="button" onClick={remove} aria-label="Delete this chat" className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      {items === null && !error && <p className="text-on-surface-variant font-label-md">Loading…</p>}

      {items && (
        <div className="rounded-2xl bg-surface-container-low border border-outline p-3 flex flex-col gap-2">
          {more && (
            <button type="button" onClick={loadOlder} className="self-center px-3 py-1.5 rounded-full border border-outline font-label-sm text-label-sm text-on-surface-variant">
              Load older messages
            </button>
          )}
          {items.map((m) => (
            <div key={m.id} className={`flex ${m.from_bot ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  m.from_bot ? 'bg-emerald-500/15 border border-emerald-500/30 rounded-br-md' : 'bg-surface-container border border-outline rounded-bl-md'
                }`}
              >
                <p className={`font-label-sm text-label-sm font-semibold ${m.from_bot ? 'text-emerald-500' : 'text-sky-500'}`}>
                  {m.from_bot ? 'Bro Paul' : m.sender_name || 'Member'}
                  {KIND_LABEL[m.kind] && <span className="font-normal text-on-surface-variant"> • {KIND_LABEL[m.kind]}</span>}
                </p>
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap break-words">{m.text}</p>
                <p className="font-label-sm text-[11px] text-on-surface-variant text-right mt-0.5">{fmtTime(m.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
    </div>
  )
}

export function ChatsTab() {
  const [filter, setFilter] = useState('')
  const [chats, setChats] = useState(null)
  const [storage, setStorage] = useState(null)
  const [open, setOpen] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminApi.listWhatsappChats(filter).then((res) => setChats(res.items || [])).catch((err) => setError(err.message))
    adminApi.getWhatsappChatStorage().then(setStorage).catch(() => {})
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  // Everything in one zip: a readable .txt per conversation, in groups/ and private/.
  const exportZip = async () => {
    setExporting(true)
    setError('')
    try {
      const [{ default: JSZip }, res] = await Promise.all([import('jszip'), adminApi.exportWhatsappChats()])
      const zip = new JSZip()
      const byChat = new Map()
      for (const m of res.items || []) {
        if (!byChat.has(m.chat_jid)) byChat.set(m.chat_jid, [])
        byChat.get(m.chat_jid).push(m)
      }
      for (const [jid, msgs] of byChat) {
        const first = msgs[0]
        const name = (first.chat_name || jid.split('@')[0]).replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'chat'
        const lines = msgs.map(
          (m) => `[${new Date(m.created_at).toLocaleString()}] ${m.from_bot ? 'Bro Paul' : m.sender_name || 'Member'}${m.kind !== 'text' ? ` (${m.kind})` : ''}: ${m.text}`
        )
        zip.file(`${first.chat_type === 'private' ? 'private' : 'groups'}/${name} - ${jid.split('@')[0]}.txt`, lines.join('\n'))
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bro-paul-chats-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      setError(err.message || 'Could not prepare the download.')
    } finally {
      setExporting(false)
    }
  }

  const deleteAll = async () => {
    if (!window.confirm('Delete ALL saved chats? Download them first if you want to keep them. This can\'t be undone.')) return
    try {
      await adminApi.deleteAllWhatsappChats()
      load()
    } catch (err) {
      setError(err.message || 'Could not delete.')
    }
  }

  if (open) {
    return (
      <Conversation
        chat={open}
        onBack={() => setOpen(null)}
        onDeleted={() => {
          setOpen(null)
          load()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-gutter">
      <StorageCard storage={storage} onExport={exportZip} exporting={exporting} onDeleteAll={deleteAll} />

      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
              filter === f.key ? 'bg-emerald-500 text-white' : 'bg-surface-container border border-outline text-on-surface-variant'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      {chats === null && !error && <p className="text-on-surface-variant font-label-md">Loading…</p>}
      {chats?.length === 0 && (
        <Card>
          <p className="font-label-md text-label-md text-on-surface-variant">
            No saved chats yet. Private chats with Bro Paul, and group messages he answers, show up here within a minute.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {(chats || []).map((c) => (
          <button
            key={c.chat_jid}
            type="button"
            onClick={() => setOpen(c)}
            className="text-left rounded-2xl bg-surface-container border border-outline p-3 flex items-center gap-3 hover:border-on-surface-variant transition-colors"
          >
            <span className={`material-symbols-outlined ${c.chat_type === 'private' ? 'text-sky-500' : 'text-emerald-500'}`}>
              {c.chat_type === 'private' ? 'person' : 'groups'}
            </span>
            <span className="min-w-0 flex-grow">
              <span className="flex items-center justify-between gap-2">
                <span className="font-body-md text-body-md font-semibold text-on-surface truncate">{chatLabel(c)}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex-none">{fmtTime(c.last_at)}</span>
              </span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                {c.last_from_bot ? 'Bro Paul: ' : ''}
                {c.last_text}
              </span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex-none">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
