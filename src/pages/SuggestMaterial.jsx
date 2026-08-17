import { useEffect, useState } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import Dropdown from '../components/ui/Dropdown'
import { communityApi, resourcesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const REACTIONS = [
  { kind: '👍', label: 'Like' },
  { kind: '❤️', label: 'Love' },
  { kind: '😂', label: 'Haha' },
  { kind: '👎', label: 'Dislike' },
]

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function Avatar({ name, url, isAdmin, size = 36 }) {
  return (
    <div
      className="relative flex-none rounded-full overflow-hidden bg-[#23242d] border border-white/10 flex items-center justify-center font-label-sm text-gray-200"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(name)
      )}
      {isAdmin && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border border-[#121318] flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 9 }}>
            verified
          </span>
        </span>
      )}
    </div>
  )
}

// Chat-style reaction badge: floats over the bottom corner of a message
// bubble. Shows the first active reaction's icon + total count when
// something's been reacted with, or a plain "add reaction" glyph when
// nothing has yet. Tap opens a small picker with all reaction kinds.
//
// Can run controlled (pass `open` + `setOpen`, used by SuggestionCard so
// an external "React" button can drive it) or uncontrolled (used by
// ReplyItem, keeps its own internal open state).
//
// Shape: rectangular/square (rounded-md), not the old pill (rounded-full).
function FloatingReactionPill({ counts = {}, myReaction, onReact, align = 'right', open, setOpen, floating = true }) {
  const [internalOpen, internalSetOpen] = useState(false)
  const isControlled = open !== undefined && setOpen !== undefined
  const pickerOpen = isControlled ? open : internalOpen
  const setPickerOpen = isControlled ? setOpen : internalSetOpen

  const activeReactions = REACTIONS.filter((r) => counts[r.kind] > 0 || myReaction === r.kind)
  const totalCount = Object.values(counts).reduce((sum, c) => sum + (c || 0), 0)

  return (
    <div className={floating ? `absolute -bottom-2.5 ${align === 'right' ? 'right-2' : 'left-2'} z-10` : 'relative'}>
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className={
          floating
            ? 'bg-[#282932] border border-white/10 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md'
            : 'flex-none w-[38px] h-[34px] bg-amber-500/15 hover:bg-amber-500/25 border border-white/10 rounded-lg flex items-center justify-center shadow-md transition-transform active:scale-95'
        }
        aria-label="React"
      >
        {activeReactions.length > 0 ? (
          <>
            <span style={{ fontSize: floating ? 12 : 17 }}>{activeReactions[0].kind}</span>
            {floating && <span className="text-gray-300 font-medium text-[10px]">{totalCount}</span>}
          </>
        ) : (
          <span className="text-gray-400" style={{ fontSize: floating ? 12 : 17 }}>🙂</span>
        )}
      </button>

      {pickerOpen && (
        <div
          className={`absolute z-20 bottom-full mb-1.5 ${align === 'right' ? 'right-0' : 'left-0'} flex gap-1 bg-[#262835] border border-white/10 rounded-lg p-1 shadow-lg`}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.kind}
              onClick={() => {
                onReact(myReaction === r.kind ? null : r.kind)
                setPickerOpen(false)
              }}
              title={r.label}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors text-[15px] ${
                myReaction === r.kind ? 'bg-orange-500/25' : 'hover:bg-[#2c2d38]'
              }`}
            >
              {r.kind}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Pill-shaped message input, styled after the mockup's bottom bar —
// used inline under each discussion thread rather than a fixed global
// bar, since replies live inside a per-suggestion panel, not one
// persistent chat screen.
function ReplyComposer({ onSubmit, placeholder = 'Write a reply…', autoFocus = false, onCancel, id, replyingTo, onClearReplyingTo }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await onSubmit(text.trim())
      setText('')
      onClearReplyingTo?.()
      onCancel?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3">
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#1a1b22] border border-white/10 border-l-2 border-l-orange-500 rounded-md px-3 py-1.5 mb-1.5">
          <p className="text-[11px] text-gray-400 truncate">
            Replying to <span className="text-gray-200">{replyingTo}</span>
          </p>
          <button
            onClick={onClearReplyingTo}
            className="flex-none ml-2 text-gray-500 hover:text-white"
            aria-label="Cancel reply reference"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#1a1b22] border border-white/10 rounded-full px-4 py-2.5 flex items-center gap-2">
          <textarea
            id={id}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none max-h-28"
          />
        </div>
        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className="flex-none bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs px-4 py-3 rounded-full transition-colors flex items-center justify-center shadow-md disabled:opacity-40"
          aria-label="Send reply"
        >
          {busy ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          ) : (
            'Send'
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-none w-9 h-9 rounded-full text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Cancel"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </div>
  )
}

// A single chat message. Own replies (isOwn) mirror the mockup's
// "Outgoing Message" treatment — right-aligned, tinted bubble, sharp
// top-right corner instead of top-left.
function ReplyItem({ reply, onReact, onReply, onDelete, currentUserId, depth = 0 }) {
  const [replying, setReplying] = useState(false)
  const isOwn = reply.user_id === currentUserId

  return (
    <div className={depth > 0 ? 'ml-9 mt-4' : 'mt-4'}>
      <div className={`flex gap-2.5 items-start ${isOwn ? 'flex-row-reverse' : ''}`}>
        <Avatar name={reply.user_name} url={reply.user_avatar} isAdmin={reply.is_admin} size={30} />

        <div className={`flex-1 min-w-0 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-baseline gap-2 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-semibold text-gray-300">
              {isOwn ? 'You' : reply.user_name}
            </span>
            {reply.is_admin && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[9px] uppercase tracking-wide">
                Admin
              </span>
            )}
            <span className="text-[10px] text-gray-500">
              {timeAgo(reply.created_at)}
            </span>
          </div>

          <div className="relative max-w-[85%] mt-1">
            <div
              className={`px-3.5 py-2.5 rounded-lg border shadow-sm ${
                isOwn
                  ? 'bg-orange-600/25 border-orange-500/40 rounded-tr-none'
                  : 'bg-[#1e1f26] border-white/5 rounded-tl-none'
              }`}
            >
              <p
                className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                  reply.is_deleted ? 'italic text-gray-500' : isOwn ? 'text-orange-50' : 'text-gray-200'
                }`}
              >
                {reply.body}
              </p>
            </div>

            {!reply.is_deleted && (
              <FloatingReactionPill
                counts={reply.reaction_counts}
                myReaction={reply.my_reaction}
                onReact={(kind) => onReact(reply.id, kind)}
                align={isOwn ? 'left' : 'right'}
              />
            )}
          </div>

          {isOwn && !reply.is_deleted && (
            <div className="flex items-center gap-1 text-[10px] text-orange-400 font-medium mt-3 pr-1">
              <span>Seen</span>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>done_all</span>
            </div>
          )}

          <div className={`flex items-center gap-3 mt-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {!reply.is_deleted && (
              <button
                onClick={() => setReplying((r) => !r)}
                className="text-[11px] text-gray-400 hover:text-orange-400 transition-colors"
              >
                Reply
              </button>
            )}
            {isOwn && !reply.is_deleted && (
              <button
                onClick={() => onDelete(reply.id)}
                className="text-[11px] text-gray-400 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {replying && (
            <div className="w-full">
              <ReplyComposer
                autoFocus
                placeholder={`Reply to ${reply.user_name}…`}
                onCancel={() => setReplying(false)}
                onSubmit={(text) => onReply(text, reply.id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SuggestionCard({ item, onReact, currentUserId }) {
  const [replies, setReplies] = useState(null) // null = not loaded yet
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [pillOpen, setPillOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)

  const loadReplies = async () => {
    setLoadingReplies(true)
    try {
      const { items } = await communityApi.suggestionReplies(item.id)
      setReplies(items)
    } catch {
      setReplies([])
    } finally {
      setLoadingReplies(false)
    }
  }

  // Discussion (replies + composer) is always visible now — no click
  // needed to reveal it, so load it as soon as the card mounts.
  useEffect(() => {
    loadReplies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTopLevelReply = async (text) => {
    const { reply } = await communityApi.addReply(item.id, { body: text })
    setReplies((prev) => [...(prev || []), reply])
  }

  const handleNestedReply = async (text, parentReplyId) => {
    const { reply } = await communityApi.addReply(item.id, { body: text, parentReplyId })
    setReplies((prev) => [...(prev || []), reply])
  }

  const handleReplyReact = async (replyId, kind) => {
    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId
          ? {
              ...r,
              my_reaction: kind,
              reaction_counts: recomputeCounts(r.reaction_counts, r.my_reaction, kind),
            }
          : r
      )
    )
    try {
      if (kind) await communityApi.reactToReply(replyId, kind)
      else await communityApi.unreactReply(replyId)
    } catch {
      loadReplies()
    }
  }

  const handleReplyDelete = async (replyId) => {
    setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, is_deleted: true, body: '[deleted]' } : r)))
    try {
      await communityApi.deleteReply(replyId)
    } catch {
      loadReplies()
    }
  }

  // Build a simple two-level tree: top-level replies, each with their
  // direct children nested under them.
  const topLevel = (replies || []).filter((r) => !r.parent_reply_id)
  const childrenOf = (id) => (replies || []).filter((r) => r.parent_reply_id === id)

  const isOwn = item.user_id === currentUserId

  return (
    <div className="overflow-hidden">
      <div className="p-stack-md">
        <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <Avatar name={item.suggested_by} url={item.suggested_by_avatar} size={38} />

          <div className={`min-w-0 flex-1 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-baseline gap-3 px-1 ${isOwn ? 'flex-row-reverse' : 'justify-between w-full'}`}>
              <span className="text-xs font-semibold text-gray-300">
                {isOwn ? 'You' : item.suggested_by || 'Someone'}
              </span>
              <span className="text-[10px] text-gray-500 flex-none">
                {timeAgo(item.created_at)}
              </span>
            </div>

            <div className="relative mt-1 mb-6 max-w-[85%] group">
              <div className={`bg-[#1e1f26] border border-white/5 rounded-2xl px-4 py-3 shadow-md ${isOwn ? 'rounded-tr-[3px]' : 'rounded-tl-[3px]'}`}>
                <p className="text-sm text-gray-200 truncate">
                  <span className="font-semibold">{item.title}</span>
                  {item.author && <span className="text-gray-400"> {item.author}</span>}
                </p>

                {item.reason && (
                  <p className="text-[11px] text-gray-400 mt-2 line-clamp-2">{item.reason}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap mt-2 text-[11px] text-gray-500">
                  {[item.category, item.department, item.course_code].filter(Boolean).map((tag, i) => (
                    <span key={i} className="after:content-['·'] after:ml-2 last:after:content-none">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Floating action dock: overlaps the bubble's bottom-left
                  corner rather than sitting in a row below it. */}
              <div className="absolute -bottom-[18px] left-2.5 flex items-center gap-1.5 z-10">
                <FloatingReactionPill
                  floating={false}
                  counts={item.reaction_counts}
                  myReaction={item.my_reaction}
                  onReact={(kind) => onReact(item.id, kind)}
                  align="left"
                  open={pillOpen}
                  setOpen={setPillOpen}
                />

                <button
                  onClick={() => {
                    setReplyingTo(item.title)
                    document.getElementById(`compose-${item.id}`)?.focus()
                  }}
                  className="flex-none w-[38px] h-[34px] bg-[#1c1d24] hover:bg-[#2f3242] border border-white/10 rounded-lg flex items-center justify-center shadow-md transition-transform active:scale-95 text-gray-100 hover:text-white"
                  aria-label="Reply"
                >
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 p-stack-md">
        {loadingReplies && (
          <p className="text-[11px] text-gray-400">Loading discussion…</p>
        )}
        {!loadingReplies && topLevel.length === 0 && (
          <p className="text-[11px] text-gray-400">No replies yet — start the discussion.</p>
        )}
        {!loadingReplies &&
          topLevel.map((reply) => (
            <div key={reply.id}>
              <ReplyItem
                reply={reply}
                currentUserId={currentUserId}
                onReact={handleReplyReact}
                onReply={handleNestedReply}
                onDelete={handleReplyDelete}
              />
              {childrenOf(reply.id).map((child) => (
                <ReplyItem
                  key={child.id}
                  reply={child}
                  depth={1}
                  currentUserId={currentUserId}
                  onReact={handleReplyReact}
                  onReply={handleNestedReply}
                  onDelete={handleReplyDelete}
                />
              ))}
            </div>
          ))}

        <ReplyComposer
          id={`compose-${item.id}`}
          onSubmit={handleTopLevelReply}
          replyingTo={replyingTo}
          onClearReplyingTo={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}

// Optimistically updates a reaction_counts object when the current
// user's reaction changes from `prevKind` to `nextKind` (either may be
// null), so the UI reflects the tap instantly without waiting on the
// server round trip.
function recomputeCounts(counts = {}, prevKind, nextKind) {
  const next = { ...counts }
  if (prevKind) next[prevKind] = Math.max((next[prevKind] || 1) - 1, 0)
  if (nextKind) next[nextKind] = (next[nextKind] || 0) + 1
  return next
}

function SuggestMaterial() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    author: '',
    publisher: '',
    categoryId: '',
    departmentId: '',
    courseCode: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadSuggestions = () => {
    communityApi
      .trendingSuggestions()
      .then(({ items }) => setSuggestions(items))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSuggestions()
    resourcesApi
      .allCategories()
      .then(({ items }) => setCategories(items))
      .catch(() => setCategories([]))
    resourcesApi
      .departments()
      .then(({ items }) => setDepartments(items))
      .catch(() => setDepartments([]))
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handlePost = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await communityApi.createSuggestion(form)
      setForm({ title: '', author: '', publisher: '', categoryId: '', departmentId: '', courseCode: '', reason: '' })
      setShowForm(false)
      loadSuggestions()
    } catch (err) {
      setError(err.message || 'Could not post your suggestion — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReact = async (id, kind) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, my_reaction: kind, reaction_counts: recomputeCounts(s.reaction_counts, s.my_reaction, kind) }
          : s
      )
    )
    try {
      if (kind) await communityApi.reactToSuggestion(id, kind)
      else await communityApi.unreactSuggestion(id)
    } catch {
      loadSuggestions()
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Suggest Material" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-5 py-6 mt-stack-md shadow-lg">
          <span className="material-symbols-outlined absolute -right-6 -top-6 text-white/15 text-[100px] rotate-[12deg] pointer-events-none">
            auto_awesome
          </span>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-headline-lg text-headline-lg font-display text-white leading-tight">
                Grow the library
              </h2>
              <p className="font-label-md text-label-md text-white/80 mt-1">
                Suggest a title, vote on what's next.
              </p>
            </div>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="flex-none flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-orange-600 font-label-md text-label-md shadow-sm active:scale-[0.97] transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showForm ? 'close' : 'add'}
              </span>
              {showForm ? 'Close' : 'Suggest'}
            </button>
          </div>
        </section>

        {showForm && (
          <form
            onSubmit={handlePost}
            className="mt-stack-lg p-stack-md rounded-xl bg-surface-container border border-outline flex flex-col gap-stack-sm"
          >
            <input
              value={form.title}
              onChange={update('title')}
              required
              placeholder="Title *"
              className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body-md"
            />
            <div className="grid grid-cols-2 gap-stack-sm">
              <input
                value={form.author}
                onChange={update('author')}
                placeholder="Author"
                className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body-md"
              />
              <input
                value={form.publisher}
                onChange={update('publisher')}
                placeholder="Publisher"
                className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-stack-sm">
              <Dropdown
                value={form.categoryId}
                onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                options={categories}
                placeholder="Category"
              />
              <Dropdown
                value={form.departmentId}
                onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
                options={departments}
                placeholder="Department"
              />
            </div>
            <input
              value={form.courseCode}
              onChange={update('courseCode')}
              placeholder="Course code (optional)"
              className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body-md"
            />
            <textarea
              value={form.reason}
              onChange={update('reason')}
              rows={2}
              placeholder="Why should we add this? (optional)"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body-md resize-none"
            />

            {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={!form.title.trim() || submitting}
              className="self-end px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </form>
        )}

        <section className="flex flex-col divide-y divide-white/5 mt-stack-lg">
          {loading && (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-sm">Loading…</p>
          )}
          {!loading && suggestions.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-sm">
              No suggestions yet — be the first to post one.
            </p>
          )}
          {suggestions.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onReact={handleReact}
              currentUserId={user?.id}
            />
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

export default SuggestMaterial