// Back button for people who arrive from a link (WhatsApp, a push, a share).
//
// Opening e.g. /library/123 straight from WhatsApp leaves no app pages
// behind it, so Back would do nothing or close the app at once. Instead,
// on that first load the page's parents are placed behind it in the browser
// history: Back walks resource -> Library -> Home, and only then exits.
// Once they're in the app, Back works as usual (to the page they came from).

const HOME = '/home'
// Pages people normally start on: nothing to put behind them.
const ENTRY_PAGES = new Set(['/', HOME, '/splash', '/signin', '/complete-profile'])

// The parent pages of a path, from Home down (not including the path itself).
export function parentChain(path) {
  const clean = path.replace(/\/+$/, '') || '/'
  if (ENTRY_PAGES.has(clean)) return []

  let m
  if ((m = clean.match(/^\/resources\/([^/]+)\/read$/))) return [HOME, '/shelf', `/library/${m[1]}`]
  if (/^\/(library|collections)\/[^/]+$/.test(clean) || /^\/s\/[^/]+$/.test(clean)) return [HOME, '/shelf']
  if (/^\/contribute\/.+/.test(clean)) return [HOME, '/contribute']
  if (/^\/reading-space\/practice\/.+/.test(clean)) return [HOME, '/reading-space', '/reading-space/practice']
  if (/^\/reading-space\/.+/.test(clean)) return [HOME, '/reading-space']
  if (/^\/help\/.+/.test(clean)) return [HOME, '/help']
  if (/^\/settings\/.+/.test(clean)) return [HOME, '/settings']
  if (/^\/admin\/.+/.test(clean)) return [HOME, '/admin']
  return [HOME]
}

// The page Back should go to when there's no history to go back through.
export function parentOf(path) {
  return parentChain(path).at(-1) || HOME
}

function routerState(idx) {
  // Same shape React Router keeps in history.state, so it reads these entries.
  return { usr: null, key: Math.random().toString(36).slice(2, 10), idx }
}

// Called once in main.jsx before the router starts. Only on a fresh arrival:
// a reload or an in-app page already has its history.
export function seedBackHistory() {
  try {
    if (window.history.state?.idx != null) return
    const { pathname, search, hash } = window.location
    const chain = parentChain(pathname)
    if (chain.length === 0) return
    const here = pathname + search + hash
    chain.forEach((p, i) => {
      if (i === 0) window.history.replaceState(routerState(0), '', p)
      else window.history.pushState(routerState(i), '', p)
    })
    window.history.pushState(routerState(chain.length), '', here)
  } catch {
    // History not available (very old browser): Back just works as before.
  }
}

// For in-app Back buttons: the previous page if there is one, otherwise the
// page's parent (so Back never does nothing).
export function goBack(navigate) {
  if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
  else navigate(parentOf(window.location.pathname), { replace: true })
}
