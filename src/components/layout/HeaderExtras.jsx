import { useEffect, useState } from 'react'
import { measureFallbackSpeed } from '../../hooks/useNetworkStatus'

const pillCls =
  'hidden lg:inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-on-surface text-[13px] font-semibold whitespace-nowrap transition-colors duration-500'

// Speed ranges for the network pill (Mbps, as the browser estimates it):
//   green  = good, 5 Mbps and up (videos and big PDFs load fine)
//   yellow = fair, 1.5 to 5 Mbps (works, big files take a while)
//   red    = slow, under 1.5 Mbps or 2G, and offline
const GOOD_MBPS = 5
const FAIR_MBPS = 1.5
const LEVELS = {
  good: { color: '#22c55e', icon: 'wifi', word: 'Good' },
  fair: { color: '#eab308', icon: 'wifi_2_bar', word: 'Fair' },
  slow: { color: '#ef4444', icon: 'wifi_1_bar', word: 'Slow' },
  offline: { color: '#ef4444', icon: 'wifi_off', word: 'Offline' },
}
const RECHECK_MS = 60 * 1000

function readConn() {
  const c = navigator.connection
  return { online: navigator.onLine, down: c?.downlink, type: c?.effectiveType }
}

// Chrome/Edge/Android give a Mbps estimate; Safari/Firefox don't, so there
// we time a tiny request instead (measured = 'fast' | 'medium' | 'slow').
function levelOf(conn, measured) {
  if (!conn.online) return 'offline'
  if (typeof conn.down === 'number' && conn.down > 0) {
    if (conn.type === '2g' || conn.type === 'slow-2g') return 'slow'
    return conn.down >= GOOD_MBPS ? 'good' : conn.down >= FAIR_MBPS ? 'fair' : 'slow'
  }
  if (conn.type) return conn.type === '4g' ? 'good' : conn.type === '3g' ? 'fair' : 'slow'
  return { fast: 'good', medium: 'fair', slow: 'slow' }[measured] || 'good'
}

export default function HeaderExtras() {
  const [now, setNow] = useState(() => new Date())
  const [conn, setConn] = useState(readConn)
  const [measured, setMeasured] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    const update = () => setConn(readConn())
    const c = navigator.connection
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    c?.addEventListener?.('change', update)

    // No Mbps estimate from this browser: time a small request now and every minute.
    let probe = null
    if (!c?.downlink && !c?.effectiveType) {
      const measure = () => { if (navigator.onLine) measureFallbackSpeed().then(setMeasured) }
      measure()
      probe = setInterval(measure, RECHECK_MS)
    }
    return () => {
      clearInterval(t)
      if (probe) clearInterval(probe)
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      c?.removeEventListener?.('change', update)
    }
  }, [])

  const level = levelOf(conn, measured)
  const { color, icon, word } = LEVELS[level]
  const netLabel = level === 'offline' ? word : conn.down ? `${conn.down} Mbps` : word

  return (
    <>
      <span
        className={pillCls}
        style={{ borderColor: `${color}66`, background: `${color}1a` }}
        title={`Connection: ${word}. Green 5+ Mbps · Yellow 1.5–5 Mbps · Red under 1.5 Mbps`}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ color }}>{icon}</span>
        {netLabel}
      </span>
      <span className={`${pillCls} border-outline bg-surface-container-high`}>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </>
  )
}
