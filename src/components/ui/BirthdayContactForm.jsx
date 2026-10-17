// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayContactForm.jsx
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const emptyBirthdayContact = {
  month: '', day: '', phone: '', whatsapp: '', sameAsPhone: false, birthdayPublic: true, contactPublic: false,
}

export function birthdayContactFromUser(user) {
  const phone = user?.phoneNumber || ''
  const whatsapp = user?.whatsappNumber || ''
  return {
    month: user?.birthMonth ? String(user.birthMonth) : '',
    day: user?.birthDay ? String(user.birthDay) : '',
    phone,
    whatsapp,
    sameAsPhone: Boolean(phone) && phone === whatsapp,
    birthdayPublic: user?.birthdayPublic !== false,
    contactPublic: Boolean(user?.contactPublic),
  }
}

export function validateBirthdayContact(v) {
  if ((v.month && !v.day) || (!v.month && v.day)) return 'Pick both a month and a day for your birthday, or leave both empty.'
  if (v.month && v.day && Number(v.day) > DAYS_IN_MONTH[Number(v.month) - 1]) {
    return `${MONTHS[Number(v.month) - 1]} does not have ${v.day} days.`
  }
  const checks = [['phone number', v.phone], ['WhatsApp number', v.sameAsPhone ? '' : v.whatsapp]]
  for (const [label, raw] of checks) {
    if (raw.trim()) {
      const digits = raw.replace(/\D/g, '')
      if (digits.length < 8 || digits.length > 15) {
        return `That ${label} does not look right. Include the country code, for example +2348012345678.`
      }
    }
  }
  return ''
}

// Always sends every field, so an emptied field clears the saved value.
export function buildBirthdayContactPayload(v) {
  const whatsapp = v.sameAsPhone ? v.phone : v.whatsapp
  return {
    birthMonth: v.month || '',
    birthDay: v.day || '',
    phoneNumber: v.phone.trim(),
    whatsappNumber: whatsapp.trim(),
    birthdayPublic: v.birthdayPublic,
    contactPublic: v.contactPublic,
  }
}

// Null when the person typed nothing, so a skipped form makes no request.
export function toBirthdayContactPayload(v) {
  if (!v.month && !v.phone.trim() && !v.whatsapp.trim()) return null
  return buildBirthdayContactPayload(v)
}

const inputClass =
  'w-full h-12 px-4 rounded-lg bg-surface-container-low border border-outline text-on-surface font-body-md focus:outline-none focus:border-primary'

function Toggle({ checked, onChange, label, hint, disabled = false }) {
  return (
    <div className={`flex items-start gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-grow min-w-0">
        <p className="font-body-md text-body-md text-on-surface">{label}</p>
        {hint && <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 flex-none rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-surface-container-highest border border-outline'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function BirthdayContactFields({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const monthNum = Number(value.month)
  const maxDay = monthNum ? DAYS_IN_MONTH[monthNum - 1] : 31
  const hasContact = Boolean(value.phone.trim() || (!value.sameAsPhone && value.whatsapp.trim()))

  return (
    <div className="flex flex-col gap-stack-md">
      <div>
        <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Birthday (no year needed)</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={value.month}
            onChange={(e) => {
              const month = e.target.value
              const max = month ? DAYS_IN_MONTH[Number(month) - 1] : 31
              set({ month, day: Number(value.day) > max ? '' : value.day })
            }}
            className={inputClass}
          >
            <option value="">Month</option>
            {MONTHS.map((name, i) => <option key={name} value={String(i + 1)}>{name}</option>)}
          </select>
          <select value={value.day} onChange={(e) => set({ day: e.target.value })} className={inputClass}>
            <option value="">Day</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => <option key={d} value={String(d)}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Phone number (optional)</label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+234 801 234 5678"
          className={inputClass}
        />
      </div>

      <div>
        <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">WhatsApp number (optional)</label>
        {!value.sameAsPhone && (
          <input
            type="tel"
            inputMode="tel"
            value={value.whatsapp}
            onChange={(e) => set({ whatsapp: e.target.value })}
            placeholder="+234 801 234 5678"
            className={inputClass}
          />
        )}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.sameAsPhone}
            onChange={(e) => set({ sameAsPhone: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="font-label-sm text-label-sm text-on-surface-variant">My WhatsApp is the same as my phone number</span>
        </label>
      </div>

      <div className="rounded-xl border border-outline bg-surface-container-low p-stack-md flex flex-col gap-stack-md">
        <Toggle
          checked={value.birthdayPublic}
          onChange={(birthdayPublic) => set({ birthdayPublic })}
          label="Celebrate my birthday in the app"
          hint="On your birthday, everyone sees your photo and name."
        />
        <Toggle
          checked={hasContact && value.contactPublic}
          onChange={(contactPublic) => set({ contactPublic })}
          disabled={!hasContact}
          label="Show my phone and WhatsApp on my birthday"
          hint="Off by default. Only signed-in members can see it, and only on your birthday. Admins can always see the numbers you add."
        />
      </div>
    </div>
  )
}

export default BirthdayContactFields