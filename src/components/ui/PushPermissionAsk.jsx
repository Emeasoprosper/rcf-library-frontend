// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/PushPermissionAsk.jsx
// Asks for notifications with the phone's own dialog, not an in-app popup.
// Browsers only show that dialog after a real tap, so we wait for the first
// tap anywhere in the app after sign-in. If the student dismisses it without
// choosing, we ask again after a few days; once they pick Allow or Block the
// phone remembers and we never ask again. Which kinds of notification they
// get (verse, news, resources...) is chosen on the Notifications page.
import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { askPhoneForPush, isPushSupported } from '../../lib/pushNotifications'

const ASKED_KEY = 'rcf_push_asked_at'
const ASK_AGAIN_MS = 3 * 24 * 60 * 60 * 1000
const SETTLE_MS = 6000 // let the page load before the first ask

function PushPermissionAsk() {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || typeof Notification === 'undefined') return undefined
    if (Notification.permission === 'denied') return undefined

    let asked = 0
    try { asked = Number(localStorage.getItem(ASKED_KEY)) || 0 } catch { /* storage blocked */ }
    if (Notification.permission === 'default' && Date.now() - asked < ASK_AGAIN_MS) return undefined

    let cancelled = false
    const onTap = () => {
      document.removeEventListener('click', onTap, true)
      if (cancelled) return
      try { localStorage.setItem(ASKED_KEY, String(Date.now())) } catch { /* storage blocked */ }
      askPhoneForPush()
    }
    const timer = setTimeout(() => {
      isPushSupported().then((ok) => {
        if (ok && !cancelled) document.addEventListener('click', onTap, true)
      })
    }, SETTLE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('click', onTap, true)
    }
  }, [isAuthenticated])

  return null
}

export default PushPermissionAsk
