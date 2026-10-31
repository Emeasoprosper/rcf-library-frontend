// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/MissingDetailsPrompt.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import {
  birthdayContactFromUser,
  validateBirthdayContact,
  buildBirthdayContactPayload,
} from './BirthdayContactForm'
import {
  GENDER_OPTIONS,
  RCF_OPTIONS,
  JOIN_REASON_OPTIONS,
  HEARD_FROM_OPTIONS,
} from './stepOptions'
import './onboarding.css'

// Title and subtitle for each question (theme/prop are no longer drawn).
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

// Full-screen photo behind each question (public/onboarding, see CREDITS.txt).
const SCENES = {
  gender: '/onboarding/scene-1.webp',
  isRcfMember: '/onboarding/scene-2.webp',
  joinReason: '/onboarding/scene-3.webp',
  heardFrom: '/onboarding/scene-4.webp',
  birthdayContact: '/onboarding/scene-5.webp',
}
const FALLBACK_SCENE = '/onboarding/scene-6.webp'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// Browsers without @property can't animate the outline angle, so they get
// a colour-shift fallback instead (see .ob-no-property in onboarding.css).
const supportsProperty = typeof window !== 'undefined' && Boolean(window.CSS?.registerProperty)

function OptionList({ options, onPick, disabled }) {
  const [picked, setPicked] = useState(null)
  return (
    <div className={`ob-options ${options.length > 2 ? 'is-grid' : ''}`}>
      {options.map((opt, i) => (
        <button
          key={String(opt.value)}
          type="button"
          disabled={disabled}
          onClick={() => {
            setPicked(opt.value)
            onPick(opt.value)
          }}
          className={`ob-btn ${i === 0 ? 'is-primary' : ''} ${picked === opt.value ? 'is-selected' : ''}`}
        >
          <span className="ob-emoji" aria-hidden="true">{opt.emoji}</span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function BirthdayStep({ value, onChange, onSave, saving }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const monthNum = Number(value.month)
  const maxDay = monthNum ? DAYS_IN_MONTH[monthNum - 1] : 31
  return (
    <div>
      <span className="ob-label">Month</span>
      <div className="ob-months">
        {MONTH_SHORT.map((name, i) => {
          const m = String(i + 1)
          return (
            <button
              key={name}
              type="button"
              aria-pressed={value.month === m}
              onClick={() => set({ month: m, day: Number(value.day) > DAYS_IN_MONTH[i] ? '' : value.day })}
              className={`ob-btn is-small ${value.month === m ? 'is-primary is-selected' : ''}`}
            >
              {name}
            </button>
          )
        })}
      </div>

      {value.month && (
        <>
          <span className="ob-label">Day</span>
          <div className="ob-days">
            {Array.from({ length: maxDay }, (_, i) => String(i + 1)).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={value.day === d}
                onClick={() => set({ day: d })}
                className={`ob-btn is-small ${value.day === d ? 'is-primary is-selected' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="ob-label" htmlFor="ob-whatsapp">WhatsApp (optional)</label>
      <input
        id="ob-whatsapp"
        className="ob-input"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+234 801 234 5678"
        value={value.whatsapp}
        onChange={(e) => set({ whatsapp: e.target.value, sameAsPhone: false })}
      />

      <label className="ob-check">
        <input type="checkbox" checked={value.birthdayPublic} onChange={(e) => set({ birthdayPublic: e.target.checked })} />
        Celebrate me in the app on my birthday 🎉
      </label>

      <button type="button" disabled={saving} onClick={onSave} className="ob-btn is-gradient ob-save">
        {saving ? 'Saving…' : 'Save my birthday'}
      </button>
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

  return (
    <OnboardingFrame
      current={current}
      stepIndex={stepIndex}
      total={total}
      title={cfg.title}
      subtitle={cfg.subtitle}
      error={error}
      onClose={skip}
    >
      {current === 'gender' && <OptionList key={current} options={GENDER_OPTIONS} disabled={saving} onPick={(v) => answer({ gender: v })} />}
      {current === 'isRcfMember' && (
        <OptionList key={current} options={RCF_OPTIONS} disabled={saving} onPick={(v) => answer({ isRcfMember: v })} />
      )}
      {current === 'joinReason' && (
        <OptionList key={current} options={JOIN_REASON_OPTIONS} disabled={saving} onPick={(v) => answer({ joinReason: v })} />
      )}
      {current === 'heardFrom' && (
        <OptionList key={current} options={HEARD_FROM_OPTIONS} disabled={saving} onPick={(v) => answer({ heardFrom: v })} />
      )}
      {current === 'birthdayContact' && bc && (
        <BirthdayStep value={bc} onChange={setBc} onSave={saveBirthdayContact} saving={saving} />
      )}
    </OnboardingFrame>
  )
}

// Full-screen layout: photo background with a slow zoom, black fade at the
// bottom, dots + close on top, question and buttons at the bottom.
function OnboardingFrame({ current, stepIndex, total, title, subtitle, error, onClose, children }) {
  const [failed, setFailed] = useState({})

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={`ob-root ${supportsProperty ? '' : 'ob-no-property'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ob-title"
    >
      <div className="ob-scenes" aria-hidden="true">
        {Object.entries(SCENES).map(([step, src]) => (
          <div key={step} className={`ob-scene ${step === current ? 'is-active' : ''}`}>
            <img
              src={failed[step] ? FALLBACK_SCENE : src}
              alt=""
              decoding="async"
              onError={() => setFailed((f) => (f[step] ? f : { ...f, [step]: true }))}
            />
          </div>
        ))}
      </div>
      <div className="ob-shade" aria-hidden="true" />

      <div className="ob-top">
        <div className="ob-dots" aria-label={`Question ${stepIndex + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`ob-dot ${i < stepIndex ? 'is-done' : ''} ${i === stepIndex ? 'is-current' : ''}`} />
          ))}
        </div>
        <button type="button" className="ob-close" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
        </button>
      </div>

      <div className="ob-content-wrap">
        <div key={current} className="ob-content">
          <h2 id="ob-title" className="ob-title">{title}</h2>
          {subtitle && <p className="ob-subtitle">{subtitle}</p>}
          {error && <p className="ob-error" role="alert">{error}</p>}
          {children}
          <button type="button" className="ob-skip" onClick={onClose}>Skip for now</button>
        </div>
      </div>
    </div>
  )
}

export default MissingDetailsPrompt
