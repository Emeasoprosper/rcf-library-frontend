// lib/pwaInstall.js
// Single source of truth for "is this session currently running inside the
// installed PWA", for triggering the real browser install prompt, and for
// remembering (across tabs/visits) whether this device has installed the
// app before — so the download-gate popup can tell "never installed" apart
// from "installed, but you're in the browser tab right now".
//
// Reuses window.__deferredInstallPrompt / 'installpromptready' /
// 'appinstalled-app' — the same globals InstallPrompt.jsx already relies on
// (captured in main.jsx) — so there is only ONE beforeinstallprompt capture
// system in the app, not a second competing one.

const INSTALLED_FLAG_KEY = 'rcf_pwa_installed'

// Broadened beyond a plain userAgent check: iPadOS has reported a
// desktop "Mac" user agent by default since iPadOS 13, so an iPad in
// its normal browsing mode fails a userAgent-only test. Touch-point
// count is the accepted way to tell a real Mac from an iPad claiming
// to be one.
export function isIos() {
  const ua = window.navigator.userAgent
  const isAppleTouch = /iphone|ipad|ipod/i.test(ua)
  const isIpadDesktopUA =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isAppleTouch || isIpadDesktopUA
}

export function isAndroid() {
  return /android/i.test(window.navigator.userAgent)
}

// True only for actual Safari — Chrome/Firefox/Edge/in-app browsers on
// iOS all use Safari's rendering engine under the hood but CANNOT
// install PWAs; only Safari itself exposes "Add to Home Screen". This
// matters because a person on an iPhone using Chrome (or an in-app
// browser from Instagram/Twitter/etc.) will never see an install path
// no matter what we show them — they need to open the link in Safari.
export function isIosSafari() {
  if (!isIos()) return false
  const ua = window.navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios|instagram|fban|fbav|line|twitter/i.test(ua)
}

// The ONLY signal we trust for "currently running inside the installed
// app". display-mode: standalone covers Android/desktop Chrome & Edge.
// navigator.standalone covers iOS Safari's "Add to Home Screen". Neither
// is spoofable just by having installed the app in a different tab.
export function isRunningAsInstalledApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// Whether the browser has handed us a programmatic install prompt yet.
// On Android Chrome this event does NOT always fire on first visit — it
// depends on Chrome's own engagement heuristics (repeat visits, time on
// site, etc.), so its absence does not mean the app can't be installed,
// only that we can't trigger install with one tap right now. iOS never
// fires this event at all — installation there is always manual.
export function canPromptInstall() {
  return Boolean(window.__deferredInstallPrompt)
}

// True if THIS device has completed installation at some point before —
// persisted in localStorage (survives closing the browser tab), set the
// moment the 'appinstalled-app' event fires below, or manually via
// markInstalledManually() for iOS where there's no completion event at
// all (the user just has to tell us, or we detect it next launch via
// isRunningAsInstalledApp()).
export function wasEverInstalled() {
  try {
    return localStorage.getItem(INSTALLED_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_FLAG_KEY, '1')
  } catch {
    // Storage unavailable — non-fatal, falls back to always showing
    // the install flow instead of the "open the app" flow.
  }
}

// Persist the installed flag the moment installation completes,
// regardless of which component is mounted when it happens.
window.addEventListener('appinstalled-app', markInstalled)
// Also covers the case where display-mode is already standalone the
// first time this module loads (e.g. app was installed in a previous
// session, or on iOS where there's no 'appinstalled' event at all —
// the FIRST time the user opens the installed icon, this line is what
// sets the flag).
if (isRunningAsInstalledApp()) markInstalled()

// Fires the real native install prompt. Resolves with the browser's
// actual outcome ('accepted' | 'dismissed') — never fakes acceptance.
// Returns null if the browser gave us no programmatic prompt (iOS,
// or Android Chrome hasn't fired beforeinstallprompt yet), so callers
// fall back to manual "Add to Home Screen" / "Install app" instructions.
export async function triggerInstall() {
  const promptEvent = window.__deferredInstallPrompt
  if (!promptEvent) return null

  promptEvent.prompt()
  const choice = await promptEvent.userChoice
  window.__deferredInstallPrompt = null
  if (choice.outcome === 'accepted') markInstalled()
  return choice.outcome
}