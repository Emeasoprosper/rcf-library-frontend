import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import './lib/pushSound.js'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { seedBackHistory } from './lib/backNav.js'
import { MAINTENANCE_MODE } from './maintenance.js'
import Maintenance from './pages/Maintenance.jsx'

// Captured as early as possible — beforeinstallprompt fires only once per
// page load, often before React finishes mounting InstallPrompt.jsx. If
// this listener is registered too late, the event is lost for the whole
// session and tapping "Install" later does nothing. Stashing it on window
// here means InstallPrompt can pick it up whenever it mounts, even late.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__deferredInstallPrompt = e
  window.dispatchEvent(new Event('installpromptready'))
})

// Fires once the user actually finishes installing (from our button, the
// browser's own address-bar icon, or Android's menu). Without this,
// InstallPrompt has no way to know it should stop showing the "Install"
// button after a successful install in the same session.
window.addEventListener('appinstalled', () => {
  window.__deferredInstallPrompt = null
  window.dispatchEvent(new Event('appinstalled-app'))
})

// Tells the self-repair script in index.html that the app code loaded.
window.__rcfStarted = true

// Look for a new version of the site whenever the app comes back to the
// front, and every 30 minutes while it's open. Phones only check on a fresh
// page load otherwise, so the installed app (resumed from the background)
// could keep showing an old version, e.g. the "We're upgrading" screen,
// for days. When a new version installs, push-sw.js reloads open pages.
if ('serviceWorker' in navigator) {
  let lastCheck = 0
  const checkForUpdate = () => {
    if (Date.now() - lastCheck < 60 * 1000) return
    lastCheck = Date.now()
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate() })
  window.addEventListener('focus', checkForUpdate)
  window.addEventListener('online', checkForUpdate)
  setInterval(checkForUpdate, 30 * 60 * 1000)
}

// Opened from a link (e.g. a resource shared on WhatsApp): put the page's
// parents behind it so Back goes resource -> Library -> Home, then exits.
seedBackHistory()

// Under construction: only the "We're upgrading" screen, nothing that
// signs in or calls the backend. Switch off in src/maintenance.js.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MAINTENANCE_MODE ? (
      <Maintenance />
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
)