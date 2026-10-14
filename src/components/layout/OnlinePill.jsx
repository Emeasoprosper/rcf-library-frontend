import { useLocation } from 'react-router-dom'
import { usePresence } from '../../contexts/PresenceContext'

// Shows "N online" when an admin has switched the indicator on. Admins
// always see it inside the admin screens, whatever the switch says.
function OnlinePill() {
  const presence = usePresence()
  const { pathname } = useLocation()

  if (!presence || presence.online === null) return null
  const visible = presence.enabled || (presence.isAdmin && pathname.startsWith('/admin'))
  if (!visible) return null

  return (
    <div
      className="flex items-center gap-1.5 h-7 px-2.5 flex-none rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500"
      title="People online right now"
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-label-sm text-label-sm font-semibold leading-none">
        {presence.online.toLocaleString()} online
      </span>
    </div>
  )
}

export default OnlinePill