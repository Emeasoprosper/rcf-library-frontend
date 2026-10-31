// lib/pwaInstall.js
//
// Android's primary install path is the real APK — not the browser's
// beforeinstallprompt/PWA flow (kept only as the iOS/desktop fallback).
//
// Version checking: public/version.json holds a single incrementing
// number. Every time a new APK is deployed to public/app-release.apk,
// bump that number by 1. This module fetches version.json and compares
// it against the version number stored locally from the visitor's last
// download — NOT against whether the app is actually installed (a
// website genuinely cannot know that with certainty). This gives three
// honest states instead of a permanent "ever installed" guess:
//   - never downloaded any version  -> "Install App"
//   - downloaded an older version   -> "Update Available"
//   - downloaded the current version -> "Continue to App"

const APK_DOWNLOADED_VERSION_KEY = 'rcf_apk_downloaded_version'
const INSTALLED_FLAG_KEY = 'rcf_pwa_installed'

export const APK_DOWNLOAD_PATH = '/app-release.apk'
export const VERSION_CHECK_PATH = '/version.json'

// Must match the Package ID set during APK packaging (PWABuilder →
// Package ID field). If that ever changes, update this to match.
export const ANDROID_PACKAGE_ID = 'com.rcfmouaulibrary.app'

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

export function isIosSafari() {
  if (!isIos()) return false
  const ua = window.navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios|instagram|fban|fbav|line|twitter/i.test(ua)
}

// Links opened inside WhatsApp, Instagram, Facebook, TikTok, Telegram etc.
// load in that app's own mini browser, which can't install apps or (often)
// download files. The student has to move to a real browser first.
export function isInAppBrowser() {
  const ua = window.navigator.userAgent
  return /instagram|fban|fbav|fb_iab|messenger|line\/|twitter|tiktok|musical_ly|bytedance|snapchat|telegram|whatsapp|; wv\)/i.test(ua)
}

// Which iPhone/iPad browser this is. Since iOS 16.4 Safari, Chrome, Edge and
// Firefox can all "Add to Home Screen"; only the Share button sits in a
// different place. Returns 'safari' | 'chrome' | 'edge' | 'firefox' | 'inapp' | 'other'.
export function iosBrowser() {
  const ua = window.navigator.userAgent
  if (isInAppBrowser()) return 'inapp'
  if (/crios/i.test(ua)) return 'chrome'
  if (/edgios/i.test(ua)) return 'edge'
  if (/fxios/i.test(ua)) return 'firefox'
  if (/safari/i.test(ua)) return 'safari'
  return 'other'
}

// Copies the site link so the student can paste it into Safari/Chrome.
export async function copySiteLink() {
  const link = window.location.origin + '/'
  try {
    await navigator.clipboard.writeText(link)
    return true
  } catch {
    window.prompt('Copy this link and open it in Safari or Chrome:', link)
    return false
  }
}

export function isRunningAsInstalledApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function canPromptInstall() {
  return Boolean(window.__deferredInstallPrompt)
}

function getStoredApkVersion() {
  try {
    const raw = localStorage.getItem(APK_DOWNLOADED_VERSION_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

function setStoredApkVersion(version) {
  try {
    localStorage.setItem(APK_DOWNLOADED_VERSION_KEY, String(version))
  } catch {
    // non-fatal
  }
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_FLAG_KEY, '1')
  } catch {
    // non-fatal
  }
}

window.addEventListener('appinstalled-app', markInstalled)
if (isRunningAsInstalledApp()) markInstalled()

// Fetches the live version.json — never cached by the browser (no-store),
// so a stale cached number can't hide a real update from a visitor.
// Returns null on any failure (offline, 404, etc.) so callers can fall
// back gracefully instead of crashing the install flow.
async function fetchLatestApkVersion() {
  try {
    const res = await fetch(VERSION_CHECK_PATH, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.version === 'number' ? data.version : null
  } catch {
    return null
  }
}

// The real status check. Returns one of:
//   'install' — never downloaded any version before
//   'update'  — downloaded a version, but a newer one now exists
//   'current' — downloaded version matches the latest available
//   'unknown' — couldn't reach version.json (offline, etc.) — caller
//               should treat this the same as 'current' rather than
//               nagging the user with no way to confirm either way
export async function getApkInstallStatus() {
  const stored = getStoredApkVersion()
  const latest = await fetchLatestApkVersion()

  if (latest === null) return stored === null ? 'install' : 'unknown'
  if (stored === null) return 'install'
  if (stored < latest) return 'update'
  return 'current'
}

// Triggers a REAL download of the actual signed APK file. Records the
// version being downloaded (read from version.json at call time) so the
// next status check reflects it accurately — not just "a download
// happened at some point."
export async function downloadApk() {
  const latest = await fetchLatestApkVersion()

  const link = document.createElement('a')
  link.href = APK_DOWNLOAD_PATH
  link.setAttribute('download', 'RCF-Library.apk')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (latest !== null) setStoredApkVersion(latest)
}

// Attempts to open the already-installed Android app via an Android
// Intent URL. Works only on Android Chrome; does nothing elsewhere.
export function tryOpenInstalledAndroidApp() {
  if (!isAndroid()) return false

  const fallback = encodeURIComponent(window.location.origin + '/')
  const host = window.location.host
  const intentUrl = `intent://${host}/#Intent;scheme=https;package=${ANDROID_PACKAGE_ID};S.browser_fallback_url=${fallback};end`

  window.location.href = intentUrl
  return true
}

// Fires the browser's native PWA install prompt — iOS/desktop fallback
// path only. Android's primary path is downloadApk() above.
export async function triggerInstall() {
  const promptEvent = window.__deferredInstallPrompt
  if (!promptEvent) return null

  promptEvent.prompt()
  const choice = await promptEvent.userChoice
  window.__deferredInstallPrompt = null
  if (choice.outcome === 'accepted') markInstalled()
  return choice.outcome
}