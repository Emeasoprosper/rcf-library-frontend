// RCFMOUAULIBRARYreact/student-dashboard/src/lib/notificationStyle.js
// Icon + colour for each kind of notification, used when it has no cover
// picture (the Updates list on Home and in the desktop sidebar).
const STYLES = {
  announcement: { icon: 'campaign', tone: 'bg-orange-500/15 text-orange-400' },
  news: { icon: 'newspaper', tone: 'bg-sky-500/15 text-sky-400' },
  advert: { icon: 'ads_click', tone: 'bg-fuchsia-500/15 text-fuchsia-400' },
  resource_approved: { icon: 'check_circle', tone: 'bg-emerald-500/15 text-emerald-400' },
  resource_rejected: { icon: 'cancel', tone: 'bg-red-500/15 text-red-400' },
  request_resolved: { icon: 'inbox', tone: 'bg-sky-500/15 text-sky-400' },
  ai_notes: { icon: 'auto_awesome', tone: 'bg-violet-500/15 text-violet-300' },
  ai_notes_failed: { icon: 'warning', tone: 'bg-amber-500/15 text-amber-400' },
  bot_upload: { icon: 'forward_to_inbox', tone: 'bg-green-500/15 text-green-400' },
  app_rating: { icon: 'star', tone: 'bg-yellow-500/15 text-yellow-400' },
  app_complaint: { icon: 'report', tone: 'bg-red-500/15 text-red-400' },
}

const FALLBACK = { icon: 'notifications', tone: 'bg-orange-500/15 text-orange-400' }

export function notificationStyle(type) {
  return STYLES[type] || FALLBACK
}
