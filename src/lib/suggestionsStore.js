const KEY = 'rcf_suggestions_v1'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function getSuggestions() {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function addSuggestion({ title, note }) {
  const items = read()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    note: note?.trim() || '',
    likes: 0,
    likedByMe: false,
    replies: [],
    createdAt: Date.now(),
  }
  write([entry, ...items])
  return entry
}

export function toggleLike(id) {
  const items = read().map((item) =>
    item.id === id
      ? { ...item, likedByMe: !item.likedByMe, likes: item.likes + (item.likedByMe ? -1 : 1) }
      : item
  )
  write(items)
  return items
}

export function addReply(id, text) {
  const trimmed = text.trim()
  if (!trimmed) return read()
  const items = read().map((item) =>
    item.id === id
      ? { ...item, replies: [...item.replies, { id: `${Date.now()}`, text: trimmed, createdAt: Date.now() }] }
      : item
  )
  write(items)
  return items
}