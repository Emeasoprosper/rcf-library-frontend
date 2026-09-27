import { useConnectionQuality } from '../../hooks/useNetworkStatus'
import { useStorageStatus } from '../../hooks/useStorageStatus'

const MESSAGES = {
  offline: { text: 'No internet connection — showing your downloaded resources.', tone: 'bg-red-500/15 text-red-400 border-red-500/30' },
  slow: { text: 'Slow connection — some content may take longer to load.', tone: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
}

function NetworkStatusBanner() {
  const quality = useConnectionQuality()
  const storage = useStorageStatus()

  // Priority: offline first (most disruptive), then low storage, then
  // slow connection — never stack more than one banner at once.
  let message = null
  if (quality === 'offline') {
    message = MESSAGES.offline
  } else if (storage.state === 'low') {
    message = {
      text: 'Storage is running low — downloaded resources may fail to save.',
      tone: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    }
  } else if (quality === 'slow') {
    message = MESSAGES.slow
  }

  if (!message) return null

  return (
    <div className={`w-full px-margin-mobile py-2 text-center border-b ${message.tone}`}>
      <p className="font-label-sm text-label-sm">{message.text}</p>
    </div>
  )
}

export default NetworkStatusBanner