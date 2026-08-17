// lib/dismissedNews.js
//
// Shared localStorage helper for tracking which admin-posted news items
// (announcements table, type: 'news') the user has already seen or
// dismissed — whether by closing the Home.jsx popup or dismissing a card
// on Notifications.jsx. Both screens now read/write through here so a
// dismissal on one is reflected on the other (and in the notification
// bell's badge count). Previously each screen used its own separate
// localStorage key/format, so dismissing on one screen didn't affect
// the other — that's fixed by this file.

const KEY = 'rcf_dismissed_news_ids'

export function getDismissedNewsIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addDismissedNewsId(id) {
  const current = getDismissedNewsIds()
  if (current.includes(id)) return
  localStorage.setItem(KEY, JSON.stringify([...current, id]))
}