import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)