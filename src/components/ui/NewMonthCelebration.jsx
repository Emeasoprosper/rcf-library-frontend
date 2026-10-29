// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/NewMonthCelebration.jsx
// "Happy New Month" greeting: shows once per month, on the 1st to 3rd
// (Lagos time), and never on top of another popup.
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Confetti, BookBuddy } from './Celebrate'

const SEEN_KEY = 'rcf_new_month_seen'
const SHOW_DAYS = 3

// One line per month, so it doesn't feel copy-pasted every time.
const MESSAGES = [
  'A brand new year and a brand new month. Fresh pages, fresh grace. Let’s make this one count.',
  'Short month, big wins. May every hour you put into your books pay off this February.',
  'March in with confidence. You’ve come further than you think, keep going.',
  'April is here. May your hard work bloom and every exam go your way.',
  'New month, new strength. May May be kind to you, your studies and your loved ones.',
  'Halfway through the year already! Take a breath, reset, and finish strong.',
  'July is calling: rest well, read well, and let God order your steps.',
  'Welcome to August. Whatever you’re believing for, may this be the month it shows up.',
  'September means fresh starts. New semester energy, new goals, same faithful God.',
  'October is here. Keep showing up for yourself, the results are on the way.',
  'November, the month of gratitude. Count your wins, even the small ones.',
  'The last chapter of the year. May December close every open door for good.',
]

function lagosParts() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date())
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

function NewMonthCelebration() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [{ year, month, day }] = useState(lagosParts)
  const signature = `${year}-${month}`

  useEffect(() => {
    if (!isAuthenticated || day > SHOW_DAYS) return undefined
    let seen = null
    try { seen = localStorage.getItem(SEEN_KEY) } catch { /* storage blocked */ }
    if (seen === signature) return undefined

    // Wait for the app to settle, then for any other popup (birthday,
    // missing details) to close before greeting.
    let timer = setTimeout(function check() {
      if (document.querySelector('[role="dialog"]')) {
        timer = setTimeout(check, 3000)
        return
      }
      setOpen(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [isAuthenticated, day, signature])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  function close() {
    try { localStorage.setItem(SEEN_KEY, signature) } catch { /* storage blocked */ }
    setOpen(false)
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Happy new month"
      data-celebration="new-month"
      className="fixed inset-0 z-[240] flex items-end md:items-center justify-center md:p-6 bg-black/60 backdrop-blur-sm overflow-hidden"
      onClick={close}
    >
      <Confetti count={18} />
      <div
        className="rcf-pop relative w-full rounded-t-[28px] md:rounded-[32px] md:max-w-3xl overflow-hidden bg-surface-container border border-outline shadow-2xl flex flex-col md:grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rcf-gradient relative bg-gradient-to-br from-[#0d9488] via-[#14b8a6] to-[#5b7cfa] flex items-center justify-center h-[30vh] min-h-[200px] md:h-auto md:min-h-[440px] overflow-hidden">
          <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute bottom-6 left-6 font-display text-[90px] md:text-[140px] font-black leading-none text-white/15 select-none" aria-hidden="true">
            {String(month).padStart(2, '0')}
          </span>
          <BookBuddy color="#ffd166" prop="sun" className="relative w-[48%] max-w-[200px] md:w-[66%] md:max-w-[280px] drop-shadow-2xl" />
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/25 text-white flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="rcf-step px-6 pt-6 pb-7 md:px-10 md:py-12 flex flex-col justify-center">
          <span className="self-start px-3 py-1 rounded-full bg-teal-500/15 text-teal-500 font-label-sm text-label-sm uppercase tracking-wide">
            Welcome to {monthName}
          </span>
          <h2 className="font-display text-[34px] md:text-[46px] leading-[1.02] font-extrabold tracking-tight text-on-surface mt-3">
            Happy New Month! 🎉
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">{MESSAGES[month - 1]}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">From all of us at RCF MOUAU Library 🤍</p>
          <button
            onClick={close}
            className="rcf-press mt-6 w-full md:w-auto md:self-start md:px-10 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-[#5b7cfa] text-white font-label-md text-label-md font-semibold shadow-lg"
          >
            Let’s go 🚀
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewMonthCelebration
