// lib/pwaInstall.js
//
// Android's primary install path is now the real APK — not the browser's
// beforeinstallprompt/PWA flow. The PWA prompt logic below is KEPT and
// still used as the fallback path for iOS and desktop, where there is no
// APK to install. Nothing about "installed" is ever inferred from a
// localStorage flag alone — see wasEverOpenedApk() below, which is
// explicitly a soft, best-effort signal for UI copy only, never treated
// as proof.

const APK_DOWNLOADED_FLAG_KEY = 'rcf_apk_downloaded'
const INSTALLED_FLAG_KEY = 'rcf_pwa_installed'

// Real, existing file — copied into public/ at build time from the
// actual signed APK PWABuilder generated. Never invent this path.
export const APK_DOWNLOAD_PATH = '/app-release.apk'

// Must match the Package ID set during APK packaging (PWABuilder →
// Package ID field). If that ever changes, update this to match —
// otherwise the "Continue to App" intent link silently fails to find
// the installed app.
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

// Still the only 100%-reliable "am I running inside an installed app"
// signal — covers both the PWA-installed case (display-mode: standalone)
// and, on Android, a TWA-wrapped APK launch (Chrome reports standalone
// display-mode there too, since a TWA is a thin Chrome Custom Tab shell).
export function isRunningAsInstalledApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function canPromptInstall() {
  return Boolean(window.__deferredInstallPrompt)
}

// Soft signal only — "has this browser triggered an APK download or PWA
// install before". NEVER proof of actual installation (the user may have
// cancelled the Android install screen, or cleared the app since). Used
// only to decide whether to show "Install App" vs "Continue to App"
// copy — actual download-gating still requires isRunningAsInstalledApp()
// to be true, exactly like before.
export function wasEverOpenedApk() {
  try {
    return (
      localStorage.getItem(APK_DOWNLOADED_FLAG_KEY) === '1' ||
      localStorage.getItem(INSTALLED_FLAG_KEY) === '1'
    )
  } catch {
    return false
  }
}

function markApkDownloaded() {
  try {
    localStorage.setItem(APK_DOWNLOADED_FLAG_KEY, '1')
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

// Triggers a REAL download of the actual signed APK file — not a fake
// success message. The browser handles the actual file transfer; this
// only marks that a download was *attempted*, not that install
// succeeded (the user still has to open the file and confirm the
// Android install prompt themselves).
export function downloadApk() {
  const link = document.createElement('a')
  link.href = APK_DOWNLOAD_PATH
  link.setAttribute('download', 'RCF-Library.apk')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  markApkDownloaded()
}

// Attempts to open the already-installed Android app via an Android
// Intent URL — the legitimate, browser-supported mechanism for this,
// NOT a guess. If the app with ANDROID_PACKAGE_ID is installed and its
// Digital Asset Links (assetlinks.json) are verified, Android routes
// this straight into the app. If it's not installed, the
// S.browser_fallback_url param sends the browser back to this same
// site instead of leaving the user on a dead intent:// URL. This only
// works on Android Chrome — everywhere else this function does nothing
// and the caller should fall back to a plain navigation.
export function tryOpenInstalledAndroidApp() {
  if (!isAndroid()) return false

  const fallback = encodeURIComponent(window.location.origin + '/')
  const host = window.location.host
  const intentUrl = `intent://${host}/#Intent;scheme=https;package=${ANDROID_PACKAGE_ID};S.browser_fallback_url=${fallback};end`

  window.location.href = intentUrl
  return true
}

// Fires the browser's native PWA install prompt — kept as the iOS/desktop
// fallback path only. Android's primary path is downloadApk() above.
export async function triggerInstall() {
  const promptEvent = window.__deferredInstallPrompt
  if (!promptEvent) return null

  promptEvent.prompt()
  const choice = await promptEvent.userChoice
  window.__deferredInstallPrompt = null
  if (choice.outcome === 'accepted') markInstalled()
  return choice.outcome
}