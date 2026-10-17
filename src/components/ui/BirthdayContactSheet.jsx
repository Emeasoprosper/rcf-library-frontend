// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayContactSheet.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import BirthdayContactFields, {
  birthdayContactFromUser,
  validateBirthdayContact,
  buildBirthdayContactPayload,
} from './BirthdayContactForm'

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
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-surface-container border border-outline p-stack-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-stack-md">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-none">
            <span className="material-symbols-outlined text-white text-[22px]">cake</span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Birthday &amp; contact</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">You get a birthday greeting by email too.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <BirthdayContactFields value={value} onChange={setValue} />

        {error && <p className="font-label-sm text-label-sm text-error mt-stack-sm">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-stack-md py-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default BirthdayContactSheet