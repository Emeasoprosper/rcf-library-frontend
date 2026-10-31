// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/DailyWordPopup.jsx
// "Today's word": the verse and study tip of the day, shown once a day
// after sign-in (Lagos day, per device). Waits for other popups (onboarding,
// birthday) to close first. Tapping the morning push (/home?daily=1) opens
// it straight away even if it was already seen today.
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { DailyQuotes } from './Engagement'

const SEEN_KEY = 'rcf_daily_word_seen'
const lagosDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

function DailyWordPopup() {
  const { isAuthenticated } = useAuth()
  const { search } = useLocation()
  const [open, setOpen] = useState(false)
  const fromPush = new URLSearchParams(search).get('daily') === '1'

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let seen = null
    try { seen = localStorage.getItem(SEEN_KEY) } catch { /* storage blocked */ }
    if (seen === lagosDay() && !fromPush) return undefined

    let timer = setTimeout(function check() {
      if (document.querySelector('[role="dialog"]')) {
        timer = setTimeout(check, 2500)
        return
      }
      setOpen(true)
    }, fromPush ? 600 : 2500)
    return () => clearTimeout(timer)
  }, [isAuthenticated, fromPush])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  function close() {
    try { localStorage.setItem(SEEN_KEY, lagosDay()) } catch { /* storage blocked */ }
    setOpen(false)
  }

  const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Today's word"
      className="fixed inset-0 z-[230] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-6"
      onClick={close}
    >
      <div
        className="rcf-pop w-full md:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] bg-surface-container border border-outline shadow-2xl p-4 md:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{today}</p>
            <h2 className="font-display text-[24px] md:text-[30px] font-extrabold leading-tight text-on-surface mt-1">Today's word ✨</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-9 h-9 flex-none rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <DailyQuotes />

        <button
          type="button"
          onClick={close}
          className="rcf-press mt-5 w-full py-3.5 rounded-2xl bg-[#16235e] text-white font-label-md text-label-md font-semibold shadow-lg"
        >
          Amen, let's go 🙏
        </button>
      </div>
    </div>
  )
}

export default DailyWordPopup
