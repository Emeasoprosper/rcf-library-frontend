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
        className="rcf-pop relative w-full max-h-[92vh] md:h-[min(600px,90vh)] overflow-hidden rounded-t-[28px] md:rounded-[28px] md:max-w-3xl bg-surface-container border border-outline shadow-2xl flex flex-col md:grid md:grid-cols-[0.8fr_1.2fr] md:grid-rows-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Picture: top on mobile, left on desktop */}
        <div className="rcf-gradient relative bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex flex-col items-center justify-center flex-none h-[20vh] min-h-[130px] md:h-full overflow-hidden text-white px-6">
          <span className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute bottom-10 -right-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
          <CakeArt className="w-[30%] max-w-[130px] md:w-[62%] md:max-w-[200px] drop-shadow-2xl" />
          <p className="hidden md:block font-display text-[20px] font-extrabold leading-tight text-center mt-3">
            We love celebrating you 🎉
          </p>
          <p className="hidden md:block text-[13px] leading-snug text-white/85 text-center mt-1.5 max-w-[240px]">
            On your birthday the library throws you a little party, plus a greeting by email.
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
        <div className="flex flex-col min-h-0 md:h-full">
          <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-7 md:pt-6 flex-none">
            <div>
              <h3 className="font-display text-[22px] md:text-[26px] leading-tight font-extrabold tracking-tight text-on-surface">
                Birthday &amp; contact
              </h3>
              <p className="text-[13px] text-on-surface-variant mt-0.5">No year needed. You choose what others can see.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="hidden md:flex w-9 h-9 flex-none rounded-full bg-surface-container-high items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="rcf-step flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-3 md:px-7">
            <BirthdayContactFields value={value} onChange={setValue} compact />
          </div>

          <div className="px-5 pb-5 pt-3 md:px-7 md:pb-6 border-t border-outline/60 flex-none">
            {error && <p className="font-label-sm text-label-sm text-error mb-2">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface py-3 px-2">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rcf-press ml-auto px-7 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-label-md text-label-md font-semibold shadow-lg disabled:opacity-50"
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