import { useEffect, useState } from 'react'

const pillCls =
  'hidden lg:inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-outline bg-surface-container-high text-on-surface text-[13px] font-semibold whitespace-nowrap'

function readConn() {
  const c = navigator.connection
  return { online: navigator.onLine, down: c?.downlink, type: c?.effectiveType }
}

export default function HeaderExtras() {
  const [now, setNow] = useState(() => new Date())
  const [conn, setConn] = useState(readConn)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    const update = () => setConn(readConn())
    const c = navigator.connection
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    c?.addEventListener?.('change', update)
    return () => {
      clearInterval(t)
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      c?.removeEventListener?.('change', update)
    }
  }, [])

  const netLabel = !conn.online
    ? 'Offline'
    : conn.down
      ? `${conn.down} Mbps`
      : conn.type
        ? conn.type.toUpperCase()
        : 'Online'

  return (
    <>
      <span className={pillCls} title="Estimated connection speed">
        <span className="material-symbols-outlined text-[16px]" style={{ color: conn.online ? '#22c55e' : '#ef4444' }}>
          {conn.online ? 'wifi' : 'wifi_off'}
        </span>
        {netLabel}
      </span>
      <span className={pillCls}>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </>
  )
}