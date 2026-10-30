// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayContactSheet.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import BirthdayContactFields, {
  birthdayContactFromUser,
  validateBirthdayContact,
  buildBirthdayContactPayload,
} from './BirthdayContactForm'
import { CakeArt } from './Celebrate'

function BirthdayContactSheet({ open, onClose }) {
  const { user, refreshUser } = useAuth()
  const [value, setValue] = useState(() => birthdayContactFromUser(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValue(birthdayContactFromUser(user))
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const save = async () => {
    const problem = validateBirthdayContact(value)
    if (problem) return setError(problem)
    setSaving(true)
    setError('')
    try {
      await authApi.saveBirthdayContact(buildBirthdayContactPayload(value))
      await refreshUser()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Birthday and contact"
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        className="rcf-pop relative w-full max-h-[94vh] overflow-hidden rounded-t-[28px] md:rounded-[32px] md:max-w-4xl bg-surface-container border border-outline shadow-2xl flex flex-col md:grid md:grid-cols-[0.9fr_1.1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Picture: top on mobile, left on desktop */}
        <div className="rcf-gradient relative bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex flex-col items-center justify-center flex-none h-[26vh] min-h-[170px] md:h-auto md:min-h-[560px] overflow-hidden text-white px-8">
          <span className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute bottom-10 -right-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
          <CakeArt className="w-[38%] max-w-[170px] md:w-[70%] md:max-w-[280px] drop-shadow-2xl" />
          <p className="hidden md:block font-display text-[26px] font-extrabold leading-tight text-center mt-4">
            We love celebrating you 🎉
          </p>
          <p className="hidden md:block font-label-md text-label-md text-white/85 text-center mt-2 max-w-xs">
            On your birthday the whole library throws you a little party, and you get a greeting by email.
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="md:hidden absolute top-3 right-3 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-3 px-6 pt-6 md:px-10 md:pt-10">
            <div>
              <h3 className="font-display text-[28px] md:text-[36px] leading-[1.05] font-extrabold tracking-tight text-on-surface">
                Birthday &amp; contact
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">No year needed. You choose what others can see.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="hidden md:flex w-10 h-10 flex-none rounded-full bg-surface-container-high items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="rcf-step flex-grow overflow-y-auto px-6 pt-5 pb-4 md:px-10">
            <BirthdayContactFields value={value} onChange={setValue} />
          </div>

          <div className="px-6 pb-6 pt-3 md:px-10 md:pb-9 border-t border-outline/60">
            {error && <p className="font-label-sm text-label-sm text-error mb-2">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface py-3 px-2">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rcf-press ml-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-label-md text-label-md font-semibold shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BirthdayContactSheet