import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'

const HEARD_FROM_OPTIONS = ['A friend', 'RCF fellowship meeting', 'Social media', 'Flyer/poster on campus', 'Church announcement', 'Other']
const JOIN_REASON_OPTIONS = ['Find study materials for school', 'Grow spiritually', 'Both of the above', 'Just exploring']

// Each question checks its own field on `user` — only fields that are
// genuinely missing get queued, and only ONE question shows at a time,
// with a clear title so it's obvious which is which. Never re-asks
// something the user already answered, even from before these fields
// existed.
function buildQueue(user) {
  const queue = []
  if (!user.gender) queue.push('gender')
  if (typeof user.isRcfMember !== 'boolean') queue.push('isRcfMember')
  if (!user.joinReason) queue.push('joinReason')
  if (!user.heardFrom) queue.push('heardFrom')
  return queue
}

function MissingDetailsPrompt() {
  const { user, refreshUser } = useAuth()
  const [queue, setQueue] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setQueue(buildQueue(user))
  }, [user?.id])

  if (!user || queue.length === 0) return null

  const current = queue[0]

  const answer = async (payload) => {
    setSaving(true)
    try {
      await authApi.updateProfileExtra(payload)
      await refreshUser()
      setQueue((q) => q.slice(1))
    } finally {
      setSaving(false)
    }
  }

  const skip = () => setQueue((q) => q.slice(1))

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-margin-mobile">
      <div className="w-full max-w-sm rounded-2xl bg-surface-container p-stack-lg">
        {current === 'gender' && (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-stack-md">One quick thing — your gender?</h3>
            <div className="grid grid-cols-2 gap-2 mb-stack-sm">
              {['Male', 'Female'].map((g) => (
                <button key={g} disabled={saving} onClick={() => answer({ gender: g })}
                  className="py-3 rounded-lg border border-outline bg-surface-container-low text-on-surface font-label-md disabled:opacity-50">
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        {current === 'isRcfMember' && (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-stack-md">Are you part of RCF?</h3>
            <div className="grid grid-cols-2 gap-2 mb-stack-sm">
              {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => (
                <button key={opt.label} disabled={saving} onClick={() => answer({ isRcfMember: opt.value })}
                  className="py-3 rounded-lg border border-outline bg-surface-container-low text-on-surface font-label-md disabled:opacity-50">
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {current === 'joinReason' && (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-stack-md">Why did you join RCF Library?</h3>
            <div className="flex flex-col gap-2 mb-stack-sm">
              {JOIN_REASON_OPTIONS.map((opt) => (
                <button key={opt} disabled={saving} onClick={() => answer({ joinReason: opt })}
                  className="py-3 px-4 rounded-lg border border-outline bg-surface-container-low text-on-surface font-label-md text-left disabled:opacity-50">
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {current === 'heardFrom' && (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-stack-md">How did you hear about us?</h3>
            <div className="flex flex-col gap-2 mb-stack-sm">
              {HEARD_FROM_OPTIONS.map((opt) => (
                <button key={opt} disabled={saving} onClick={() => answer({ heardFrom: opt })}
                  className="py-3 px-4 rounded-lg border border-outline bg-surface-container-low text-on-surface font-label-md text-left disabled:opacity-50">
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={skip} className="w-full text-center font-label-md text-label-md text-on-surface-variant py-2">
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default MissingDetailsPrompt