// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/DailyWordPopup.jsx
// "Today's word": the verse and study tip of the day as a stack of square
// cards, one at a time (swipe or ✕ for the next, the stack peeks out
// underneath). Shown once a day after sign-in (Lagos day, per device). Waits
// for other popups (onboarding, birthday) to close first. Tapping the morning
// push (/home?daily=1) opens it straight away even if it was already seen today.
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { QuoteActions } from './Engagement'
import { verseOfTheDay, tipOfTheDay } from '../../lib/dailyInspiration'
import { useFitCard } from '../../lib/fitText'

const SEEN_KEY = 'rcf_daily_word_seen'
const SWIPE_AWAY = 90
const lagosDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

function DeckCard({ cardRef, label, text, by, drag, leaving }) {
  useFitCard(cardRef, text)
  const x = leaving ? leaving * 600 : drag
  return (
    <article
      ref={cardRef}
      className="relative w-full aspect-square overflow-hidden rounded-[24px] bg-white shadow-2xl px-7 py-7 flex flex-col items-center text-center touch-pan-y select-none"
      style={{
        transform: `translateX(${x}px) rotate(${x / 18}deg)`,
        transition: drag && !leaving ? 'none' : 'transform 0.3s ease',
      }}
    >
      <span className="w-11 h-11 flex-none rounded-full overflow-hidden ring-2 ring-black/5 bg-[#16235e]">
        <img src="/android-chrome-192x192.png" alt="" className="w-full h-full object-cover" draggable="false" />
      </span>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#16235e]/50">{label}</p>
      <div data-fit-region className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        <p data-fit-text className="leading-snug break-words text-[#27272a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {text}
        </p>
      </div>
      <p className="text-[13px] font-semibold text-[#a1a1aa]">{by}</p>
      <p data-share-footer className="hidden mt-2 text-[11px] font-semibold text-[#16235e]/70">
        Daily verses & study tips · rcf-mouau-library.vercel.app
      </p>
    </article>
  )
}

function DailyWordPopup() {
  const { isAuthenticated } = useAuth()
  const { search } = useLocation()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [leaving, setLeaving] = useState(0)
  const start = useRef(null)
  const cardRef = useRef(null)
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
      setIndex(0)
      setOpen(true)
    }, fromPush ? 600 : 2500)
    return () => clearTimeout(timer)
  }, [isAuthenticated, fromPush])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') next(e.key === 'ArrowLeft' ? -1 : 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  const day = lagosDay()
  const verse = verseOfTheDay()
  const tip = tipOfTheDay()
  const cards = [
    { id: `${day}-verse`, label: 'Verse of the day', text: verse.text, by: verse.ref },
    { id: `${day}-tip`, label: 'Study tip of the day', text: tip.text, by: 'RCF Library' },
  ]
  const card = cards[index]
  const behind = cards.length - index - 1

  function close() {
    try { localStorage.setItem(SEEN_KEY, lagosDay()) } catch { /* storage blocked */ }
    setOpen(false)
    setDrag(0)
    setLeaving(0)
  }

  // Throw the top card off to one side, then show the next (or close after the last).
  function next(dir = -1) {
    if (leaving) return
    setLeaving(dir)
    setTimeout(() => {
      setLeaving(0)
      setDrag(0)
      if (index + 1 >= cards.length) close()
      else setIndex(index + 1)
    }, 280)
  }

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    start.current = e.clientX
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (start.current !== null) setDrag(e.clientX - start.current)
  }
  const onPointerUp = () => {
    if (start.current === null) return
    start.current = null
    if (Math.abs(drag) > SWIPE_AWAY) next(Math.sign(drag))
    else setDrag(0)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Today's word"
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/70 backdrop-blur-sm p-5"
      onClick={close}
    >
      <div className="rcf-pop w-full max-w-[min(380px,calc(100vh-220px))] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-[12px] font-semibold text-white/70">
          {new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          {index + 1} of {cards.length}
        </p>

        {/* The stack: soft layers peek out under the top card, one per card still to come. */}
        <div
          className="relative w-full pb-6"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {behind >= 1 && <span className="absolute left-[4%] right-[4%] bottom-3 h-16 rounded-[22px] bg-white/80" aria-hidden="true" />}
          <span className="absolute left-[8%] right-[8%] bottom-0 h-16 rounded-[22px] bg-white/50" aria-hidden="true" />
          <DeckCard key={card.id} cardRef={cardRef} label={card.label} text={card.text} by={card.by} drag={drag} leaving={leaving} />
        </div>

        <div className="mt-6">
          <QuoteActions key={card.id} id={card.id} text={card.text} by={card.by} cardRef={cardRef} round onClose={() => next(-1)} />
        </div>
        <p className="mt-3 text-[11px] text-white/60">
          {index + 1 < cards.length ? 'Swipe or tap ✕ for the next one' : 'Tap ✕ to finish'}
        </p>
      </div>
    </div>
  )
}

export default DailyWordPopup
