// RCFMOUAULIBRARYreact/student-dashboard/src/lib/externalLink.js
// The only way the app sends someone to another website (news articles).
// Instead of opening the link straight away, it asks LeaveSiteDialog (mounted
// once in App.jsx) to show "You're about to leave RCF Library" first.
export const LEAVE_EVENT = 'rcf-confirm-leave'

export function confirmExternal(url, { title = '', sourceName = '' } = {}) {
  if (!url) return
  window.dispatchEvent(new CustomEvent(LEAVE_EVENT, { detail: { url, title, sourceName } }))
}
