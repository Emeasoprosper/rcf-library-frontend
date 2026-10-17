// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/MissingDetailsPrompt.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import BirthdayContactFields, {
  birthdayContactFromUser,
  validateBirthdayContact,
  buildBirthdayContactPayload,
} from './BirthdayContactForm'

const HEARD_FROM_OPTIONS = ['A friend', 'RCF fellowship meeting', 'Social media', 'Flyer/poster on campus', 'Church announcement', 'Other']
const JOIN_REASON_OPTIONS = ['Find study materials for school', 'Grow spiritually', 'Both of the above', 'Just exploring']

// Skipping the birthday question is remembered for two weeks, so nobody
// is nagged every time they open the app.
const SKIP_KEY = 'rcf_skip_birthday_contact'
const SKIP_DAYS = 14

function skippedRecently() {
  try {
    const t = Number(localStorage.getItem(SKIP_KEY))
    return Boolean(t) && Date.now() - t < SKIP_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function rememberSkip() {
  try {
    localStorage.setItem(SKIP_KEY, String(Date.now()))
  } catch {
    // storage blocked: the question simply shows again next time
  }
}

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
  if (!user.birthMonth && !skippedRecently()) queue.push('birthdayContact')
  return queue
}

function MissingDetailsPrompt() {
  const { user, refreshUser } = useAuth()
  const [queue, setQueue] = useState([])
  const [saving, setSaving] = useState(false)
  const [bc, setBc] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) setQueue(buildQueue(user))
  }, [user?.id])

  const current = queue[0]

  useEffect(() => {
    if (current === 'birthdayContact') {
      setBc(birthdayContactFromUser(user))
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  if (!user || queue.length === 0) return null

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

  const saveBirthdayContact = async () => {
    const problem = validateBirthdayContact(bc)
    if (problem) return setError(problem)
    if (!bc.month && !bc.phone.trim() && !bc.whatsapp.trim()) {
      return setError('Pick your birthday month and day, or tap Skip for now.')
    }
    setSaving(true)
    setError('')
    try {
      await authApi.saveBirthdayContact(buildBirthdayContactPayload(bc))
      await refreshUser()
      rememberSkip()
      setQueue((q) => q.slice(1))
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const skip = () => {
    if (current === 'birthdayContact') rememberSkip()
    setQueue((q) => q.slice(1))
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-margin-mobile">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container p-stack-lg">
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

        {current === 'birthdayContact' && bc && (
          <>
            <div className="flex items-center gap-3 mb-stack-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-none">
                <span className="material-symbols-outlined text-white text-[22px]">cake</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">When is your birthday?</h3>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-md">
              We celebrate birthdays in the library and send you a greeting by email. Phone and WhatsApp are optional, and you choose what others can see.
            </p>
            <BirthdayContactFields value={bc} onChange={setBc} />
            {error && <p className="font-label-sm text-label-sm text-error mt-stack-sm">{error}</p>}
            <button
              disabled={saving}
              onClick={saveBirthdayContact}
              className="w-full mt-stack-md py-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
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