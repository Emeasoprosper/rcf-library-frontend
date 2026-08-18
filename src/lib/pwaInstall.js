// lib/pwaInstall.js
// Single source of truth for "is this session currently running inside the
// installed PWA" and for triggering the real browser install prompt.
// Reuses window.__deferredInstallPrompt / 'installpromptready' /
// 'appinstalled-app' — the same globals InstallPrompt.jsx already relies on
// (captured in main.jsx) — so there is only ONE beforeinstallprompt capture
// system in the app, not a second competing one.

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
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

export function canPromptInstall() {
  return Boolean(window.__deferredInstallPrompt)
}

// Fires the real native install prompt. Resolves with the browser's
// actual outcome ('accepted' | 'dismissed') — never fakes acceptance.
// Returns null if the browser gave us no programmatic prompt (iOS Safari,
// or Chrome hasn't fired beforeinstallprompt yet), so callers fall back
// to manual "Add to Home Screen" instructions.
export async function triggerInstall() {
  const promptEvent = window.__deferredInstallPrompt
  if (!promptEvent) return null

  promptEvent.prompt()
  const choice = await promptEvent.userChoice
  window.__deferredInstallPrompt = null
  return choice.outcome
}