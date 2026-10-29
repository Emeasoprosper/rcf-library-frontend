// pages/CompleteProfile.jsx
// Sign-up details, one step at a time. Mobile: picture on top. Desktop:
// picture on the left, questions on the right (StepShell).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'
import {
  BirthdayQuickFields,
  emptyBirthdayContact,
  validateBirthdayContact,
  toBirthdayContactPayload,
} from '../components/ui/BirthdayContactForm'
import StepShell, { OptionCard } from '../components/ui/StepShell'
import { BookBuddy, CakeArt } from '../components/ui/Celebrate'
import {
  STEP_THEMES,
  CARD_ROTATION,
  GENDER_OPTIONS,
  RCF_OPTIONS,
  JOIN_REASON_OPTIONS,
  HEARD_FROM_OPTIONS,
} from '../components/ui/stepOptions'

const LEVELS = ['100', '200', '300', '400', '500', 'PG']

const STEPS = [
  { key: 'school', theme: 'blue', prop: 'cap', title: 'Tell us about your studies', subtitle: 'This confirms you are a MOUAU student.' },
  { key: 'gender', theme: 'pink', prop: 'sparkle', title: 'Brother or sister?', subtitle: 'Just one tap.' },
  { key: 'rcf', theme: 'green', prop: 'heart', title: 'Are you part of RCF?', subtitle: 'Everyone is welcome here either way.' },
  { key: 'reason', theme: 'orange', prop: 'question', title: 'What brings you here?', subtitle: 'Helps us show you the right things.' },
  { key: 'heard', theme: 'slate', prop: 'megaphone', title: 'How did you find us?', subtitle: 'So we know what is working.' },
  { key: 'birthday', theme: 'teal', prop: null, title: 'When do we celebrate you?', subtitle: 'Optional. No year needed 🎂' },
]

const inputClass =
  'w-full h-14 px-4 rounded-2xl bg-surface-container-low border border-outline text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all'

function Cards({ options, selected, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt, i) => (
        <OptionCard
          key={String(opt.value)}
          theme={CARD_ROTATION[i % CARD_ROTATION.length]}
          emoji={opt.emoji}
          label={opt.label}
          selected={selected === opt.value}
          tall={options.length <= 2}
          onClick={() => onPick(opt.value)}
        />
      ))}
    </div>
  )
}

function CompleteProfile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [studentId, setStudentId] = useState('')
  const [gender, setGender] = useState('')
  const [isRcfMember, setIsRcfMember] = useState(null)
  const [joinReason, setJoinReason] = useState('')
  const [heardFrom, setHeardFrom] = useState('')
  const [bc, setBc] = useState(emptyBirthdayContact)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cfg = STEPS[step]
  const isLast = step === STEPS.length - 1
  const firstName = user?.name?.split(' ')[0]

  function stepProblem() {
    if (cfg.key === 'school' && (!department.trim() || !level || !studentId.trim())) {
      return 'Please fill in your department, level and matric number.'
    }
    if (cfg.key === 'gender' && !gender) return 'Please pick one to continue.'
    if (cfg.key === 'birthday') return validateBirthdayContact(bc)
    return ''
  }

  function goNext() {
    const problem = stepProblem()
    if (problem) return setError(problem)
    setError('')
    if (isLast) return submit()
    setStep((s) => s + 1)
  }

  // Tapping a card answers and moves on, after a beat so the tick shows.
  const pickAndNext = (setter) => (value) => {
    setter(value)
    setError('')
    setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 260)
  }

  async function submit() {
    setSubmitting(true)
    try {
      await authApi.completeProfile({
        affiliation: 'mouau',
        category: 'student',
        department: department.trim(),
        level,
        studentId: studentId.trim(),
        gender,
        isRcfMember,
        joinReason: joinReason || null,
        heardFrom: heardFrom || null,
      })
      const bcPayload = toBirthdayContactPayload(bc)
      if (bcPayload) {
        try {
          await authApi.saveBirthdayContact(bcPayload)
        } catch {
          // The profile itself is saved. The birthday can be added later under Profile.
        }
      }
      await refreshUser()
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const art =
    cfg.key === 'birthday' ? (
      <CakeArt className="w-full drop-shadow-xl" />
    ) : (
      <BookBuddy color={STEP_THEMES[cfg.theme].buddy} prop={cfg.prop} className="w-full drop-shadow-xl" />
    )

  const footer = (
    <div className="flex flex-col gap-2">
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => { setError(''); setStep((s) => s - 1) }}
            aria-label="Back"
            className="rcf-press w-12 h-12 flex-none rounded-2xl border border-outline flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/home')} className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface py-3 px-1">
            Skip for now
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="rcf-press ml-auto px-8 h-12 rounded-2xl bg-[#6cc04a] hover:bg-[#5fae45] text-white font-label-md text-label-md font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? 'Saving…' : isLast ? 'Continue to Library' : 'Next'}
          {!submitting && <span className="material-symbols-outlined text-[20px]">{isLast ? 'check' : 'arrow_forward'}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <StepShell
      mode="page"
      theme={cfg.theme}
      stepKey={cfg.key}
      art={art}
      step={step}
      total={STEPS.length}
      title={step === 0 && firstName ? `Welcome, ${firstName} 👋` : cfg.title}
      subtitle={step === 0 && firstName ? `${cfg.title}. ${cfg.subtitle}` : cfg.subtitle}
      footer={footer}
    >
      {cfg.key === 'school' && (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department, e.g. Computer Science"
            aria-label="Department"
            className={inputClass}
          />
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Level</p>
            <div className="grid grid-cols-6 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`rcf-press h-12 rounded-xl border font-label-md text-label-md transition-colors ${
                    level === lvl
                      ? 'bg-[#5b7cfa] text-white border-transparent shadow-md'
                      : 'bg-surface-container-low text-on-surface border-outline hover:border-on-surface-variant'
                  }`}
                >
                  {lvl === 'PG' ? 'PG' : `${lvl}L`}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Matric number, e.g. 2021/123456"
            aria-label="Matric or student ID"
            className={inputClass}
          />
        </div>
      )}
      {cfg.key === 'gender' && <Cards options={GENDER_OPTIONS} selected={gender} onPick={pickAndNext(setGender)} />}
      {cfg.key === 'rcf' && <Cards options={RCF_OPTIONS} selected={isRcfMember} onPick={pickAndNext(setIsRcfMember)} />}
      {cfg.key === 'reason' && <Cards options={JOIN_REASON_OPTIONS} selected={joinReason} onPick={pickAndNext(setJoinReason)} />}
      {cfg.key === 'heard' && <Cards options={HEARD_FROM_OPTIONS} selected={heardFrom} onPick={pickAndNext(setHeardFrom)} />}
      {cfg.key === 'birthday' && <BirthdayQuickFields value={bc} onChange={setBc} />}
    </StepShell>
  )
}

export default CompleteProfile
