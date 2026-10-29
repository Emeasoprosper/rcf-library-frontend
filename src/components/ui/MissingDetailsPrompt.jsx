// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/MissingDetailsPrompt.jsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import {
  BirthdayQuickFields,
  birthdayContactFromUser,
  validateBirthdayContact,
  buildBirthdayContactPayload,
} from './BirthdayContactForm'
import StepShell, { OptionCard } from './StepShell'
import { BookBuddy, CakeArt } from './Celebrate'
import {
  STEP_THEMES,
  CARD_ROTATION,
  GENDER_OPTIONS,
  RCF_OPTIONS,
  JOIN_REASON_OPTIONS,
  HEARD_FROM_OPTIONS,
} from './stepOptions'

// Picture + colour for each question, so every step looks different.
const STEPS = {
  gender: { theme: 'blue', prop: 'sparkle', title: 'First, a quick one', subtitle: 'Are you a brother or a sister?' },
  isRcfMember: { theme: 'pink', prop: 'heart', title: 'Are you part of RCF?', subtitle: "Everyone is welcome here either way." },
  joinReason: { theme: 'green', prop: 'question', title: 'What brings you here?', subtitle: 'Helps us put the right things in front of you.' },
  heardFrom: { theme: 'orange', prop: 'megaphone', title: 'How did you find us?', subtitle: 'So we know what is working.' },
  birthdayContact: { theme: 'teal', prop: null, title: 'When do we celebrate you?', subtitle: 'No year needed. We throw you a little party in the app 🎂' },
}

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
// genuinely missing get queued, and only ONE question shows at a time.
// Never re-asks something the user already answered.
function buildQueue(user) {
  const queue = []
  if (!user.gender) queue.push('gender')
  if (typeof user.isRcfMember !== 'boolean') queue.push('isRcfMember')
  if (!user.joinReason) queue.push('joinReason')
  if (!user.heardFrom) queue.push('heardFrom')
  if (!user.birthMonth && !skippedRecently()) queue.push('birthdayContact')
  return queue
}

function StepArt({ step }) {
  const cfg = STEPS[step]
  if (step === 'birthdayContact') return <CakeArt className="w-full drop-shadow-xl" />
  return <BookBuddy color={STEP_THEMES[cfg.theme].buddy} prop={cfg.prop} className="w-full drop-shadow-xl" />
}

function OptionGrid({ options, onPick, selected, disabled, columns = 2 }) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((opt, i) => (
        <OptionCard
          key={String(opt.value)}
          theme={CARD_ROTATION[i % CARD_ROTATION.length]}
          emoji={opt.emoji}
          label={opt.label}
          selected={selected === opt.value}
          disabled={disabled}
          tall={options.length <= 2}
          onClick={() => onPick(opt.value)}
        />
      ))}
    </div>
  )
}

function MissingDetailsPrompt() {
  const { user, refreshUser } = useAuth()
  const [queue, setQueue] = useState([])
  const [total, setTotal] = useState(0)
  const [queueFor, setQueueFor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [bc, setBc] = useState(null)
  const [error, setError] = useState('')

  // Build the question list once per signed-in user (derived during render,
  // React's recommended alternative to setState inside an effect).
  if (user && queueFor !== user.id) {
    const q = buildQueue(user)
    setQueueFor(user.id)
    setQueue(q)
    setTotal(q.length)
  }

  const current = queue[0]

  // Fill the birthday form from the profile when that step comes up.
  if (current === 'birthdayContact' && !bc && user) setBc(birthdayContactFromUser(user))

  if (!user || queue.length === 0) return null

  const answer = async (payload) => {
    setSaving(true)
    setError('')
    try {
      await authApi.updateProfileExtra(payload)
      await refreshUser()
      setQueue((q) => q.slice(1))
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveBirthdayContact = async () => {
    const problem = validateBirthdayContact(bc)
    if (problem) return setError(problem)
    if (!bc.month || !bc.day) return setError('Tap your birthday month and day, or choose Skip for now.')
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
    setError('')
    setQueue((q) => q.slice(1))
  }

  const cfg = STEPS[current]
  const stepIndex = Math.max(total - queue.length, 0)

  const footer = (
    <div className="flex flex-col gap-2">
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={skip} className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface py-3 px-2">
          Skip for now
        </button>
        {current === 'birthdayContact' && (
          <button
            type="button"
            disabled={saving}
            onClick={saveBirthdayContact}
            className="rcf-press ml-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-label-md text-label-md font-semibold shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save my birthday'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <StepShell
      mode="modal"
      theme={cfg.theme}
      stepKey={current}
      art={<StepArt step={current} />}
      step={stepIndex}
      total={total}
      title={cfg.title}
      subtitle={cfg.subtitle}
      footer={footer}
      onClose={skip}
    >
      {current === 'gender' && <OptionGrid options={GENDER_OPTIONS} disabled={saving} onPick={(v) => answer({ gender: v })} />}
      {current === 'isRcfMember' && (
        <OptionGrid options={RCF_OPTIONS} disabled={saving} onPick={(v) => answer({ isRcfMember: v })} />
      )}
      {current === 'joinReason' && (
        <OptionGrid options={JOIN_REASON_OPTIONS} disabled={saving} onPick={(v) => answer({ joinReason: v })} />
      )}
      {current === 'heardFrom' && (
        <OptionGrid options={HEARD_FROM_OPTIONS} disabled={saving} onPick={(v) => answer({ heardFrom: v })} />
      )}
      {current === 'birthdayContact' && bc && <BirthdayQuickFields value={bc} onChange={setBc} />}
    </StepShell>
  )
}

export default MissingDetailsPrompt
