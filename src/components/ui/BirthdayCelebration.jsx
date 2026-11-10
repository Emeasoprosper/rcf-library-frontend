// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayCelebration.jsx
// The birthday popup: today's celebrants as tilted photo cards ("polaroids")
// with confetti and a hand-written "Lovely Celebrations", a headline with
// highlighted words, then the celebrant's card (photo, name, the contacts
// they chose to share), a WhatsApp wish button, and Next/Back when several
// people are celebrating. All buttons are full pills.
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { birthdaysApi } from '../../services/api'
import usePopupMusic from '../../hooks/usePopupMusic'
import PopupMusicButton from './PopupMusicButton'

import { Confetti } from './Celebrate'

const SEEN_KEY = 'rcf_birthday_seen'
// The happy-birthday song in /public. (The old path pointed at a file that
// was never added, so the popup played nothing.)
const MUSIC_SRC = '/sub_clair-happy-birthday-592177.mp3'
// Hand-written look for "Lovely Celebrations", loaded only when the popup opens.
const MARKER_FONT = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap'

const lagosDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'friend'
const digitsOnly = (s) => String(s || '').replace(/\D/g, '')

function useMarkerFont(active) {
  useEffect(() => {
    if (!active || document.querySelector(`link[href="${MARKER_FONT}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = MARKER_FONT
    document.head.appendChild(link)
  }, [active])
}

// A word with a coloured box behind it, like a marker highlight.
function Highlight({ color, children }) {
  return (
    <span className={`${color} text-white px-1.5 mx-0.5 rounded-[4px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]`}>
      {children}
    </span>
  )
}

function PartyHat({ className = '' }) {
  return (
    <svg viewBox="0 0 60 70" className={className} aria-hidden="true">
      <path d="M30 4 L54 62 Q30 70 6 62 Z" fill="#facc15" />
      <path d="M30 4 L40 28 Q30 31 20 28 Z" fill="#ec4899" />
      <path d="M18 34 Q30 38 43 34 L47 44 Q30 49 14 44 Z" fill="#38bdf8" />
      <path d="M11 52 Q30 57 50 52 L54 62 Q30 70 6 62 Z" fill="#a855f7" />
      <circle cx="30" cy="5" r="5.5" fill="#f97316" />
    </svg>
  )
}

function Heart({ className = '' }) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden="true">
      <path d="M12 21 C5 15 1 11 1 6.5 A5.5 5.5 0 0 1 12 4 A5.5 5.5 0 0 1 23 6.5 C23 11 19 15 12 21 Z" fill="#ec4899" />
    </svg>
  )
}

// The confetti doodles around the photos (squiggles, dashes, stars, a popper).
function Doodles() {
  const squiggle = 'M2 10 C6 2 10 2 12 10 S18 18 22 10'
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <g fill="none" strokeWidth="4" strokeLinecap="round">
        <path d={squiggle} stroke="#f97316" transform="translate(40 92) rotate(-50 12 10)" />
        <path d={squiggle} stroke="#38bdf8" transform="translate(338 70) rotate(30 12 10)" />
        <path d={squiggle} stroke="#ec4899" transform="translate(322 200) rotate(75 12 10)" />
        <path d={squiggle} stroke="#22c55e" transform="translate(352 238) rotate(-20 12 10)" />
        <path d={squiggle} stroke="#38bdf8" transform="translate(70 200) rotate(20 12 10)" />
        <path d="M352 120 c10 -16 22 -4 12 6 c-10 10 6 22 16 8" stroke="#f97316" />
        <path d="M368 160 c8 -6 16 0 10 8" stroke="#fb923c" />
        <path d="M24 150 l10 6" stroke="#a855f7" />
        <path d="M376 108 l8 -8" stroke="#ec4899" />
        <path d="M104 236 l6 10" stroke="#f97316" />
        <path d="M320 104 l-6 -10" stroke="#facc15" />
      </g>
      <g fill="#facc15">
        <path d="M58 132 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1 z" />
        <path d="M330 150 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1 z" />
      </g>
      <g fill="#a855f7" opacity="0.9">
        <circle cx="300" cy="40" r="3" />
        <circle cx="160" cy="268" r="3" />
        <circle cx="384" cy="190" r="3" />
      </g>
      {/* A party popper */}
      <g transform="translate(38 118) rotate(-35)">
        <path d="M0 0 L26 -10 L26 10 Z" fill="#a855f7" />
        <path d="M8 -3 L12 -5 M14 -6 L18 -7 M10 4 L14 5 M16 7 L20 8" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
      </g>
    </svg>
  )
}

// One tilted photo card. hat = the party hat on top (the person in focus).
function Polaroid({ person, style, hat = false, focus = false }) {
  const first = firstName(person.name)
  return (
    <div
      className={`absolute bg-white p-[5px] rounded-[16px] transition-all duration-500 ${focus ? 'z-10 shadow-[0_14px_36px_rgba(0,0,0,0.55)]' : 'shadow-[0_10px_26px_rgba(0,0,0,0.45)]'}`}
      style={style}
    >
      <div className="w-full aspect-square rounded-[11px] overflow-hidden bg-gradient-to-br from-pink-400 via-orange-300 to-amber-200 flex items-center justify-center">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" draggable="false" />
        ) : (
          <span className="font-display text-[40px] font-extrabold text-white drop-shadow">{first.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {hat && <PartyHat className="absolute left-1/2 -translate-x-1/2 -top-[34%] w-[36%] rotate-[8deg] drop-shadow-md" />}
    </div>
  )
}

// Where the photo cards sit: the person in focus is always in front with
// the hat; up to two others celebrating today sit behind.
const LAYOUTS = {
  // Below and right of "Lovely Celebrations", so the hat never touches it.
  1: [{ left: '60%', top: '38%', width: '40%', transform: 'translateX(-50%) rotate(-4deg)' }],
  2: [
    { left: '14%', top: '20%', width: '36%', transform: 'rotate(-8deg)' },
    { left: '46%', top: '34%', width: '38%', transform: 'rotate(5deg)' },
  ],
  3: [
    { left: '7%', top: '24%', width: '35%', transform: 'rotate(-9deg)' },
    { left: '56%', top: '21%', width: '34%', transform: 'rotate(7deg)' },
    { left: '50%', top: '47%', width: '33%', transform: 'translateX(-50%) rotate(-2deg)' },
  ],
}

function PhotoCollage({ items, index }) {
  const current = items[index]
  const others = items.filter((_, i) => i !== index).slice(0, 2)
  const shown = [...others, current] // the person in focus last = in front
  const layout = LAYOUTS[shown.length]
  return (
    <>
      {shown.map((p, i) => (
        <Polaroid key={p.id} person={p} style={layout[i]} hat={p === current} focus={p === current} />
      ))}
    </>
  )
}

function BirthdayCelebration() {
  const { isAuthenticated, user } = useAuth()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let cancelled = false
    // A short delay so it never collides with the app's own start-up.
    const timer = setTimeout(() => {
      birthdaysApi
        .today()
        .then((res) => {
          if (cancelled || !res?.items?.length) return
          const signature = `${lagosDate()}:${res.items.map((p) => p.id).sort().join(',')}`
          let seen = null
          try { seen = localStorage.getItem(SEEN_KEY) } catch { /* storage blocked */ }
          if (seen === signature) return
          setData({ ...res, signature })
          setIndex(0)
          setOpen(true)
        })
        .catch(() => {})
    }, 1200)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isAuthenticated, user?.id])

  const music = usePopupMusic(MUSIC_SRC, { active: open && Boolean(data), loop: true, volume: 0.5 })
  useMarkerFont(open && Boolean(data))

  const last = data ? data.items.length - 1 : 0
  const close = () => {
    if (data) {
      try { localStorage.setItem(SEEN_KEY, data.signature) } catch { /* storage blocked */ }
    }
    setOpen(false)
  }
  const next = () => setIndex((i) => Math.min(i + 1, last))
  const prev = () => setIndex((i) => Math.max(i - 1, 0))

  useEffect(() => {
    if (!open || !data) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data, last])

  if (!open || !data) return null

  const person = data.items[index]
  const first = firstName(person.name)
  const others = data.total - 1
  const hasContact = Boolean(person.whatsapp || person.phone)
  const wishText = `Happy Birthday ${first}! 🎉🎂 Wishing you a blessed new year of life. From RCF MOUAU Library`
  const waLink = person.whatsapp ? `https://wa.me/${digitsOnly(person.whatsapp)}?text=${encodeURIComponent(wishText)}` : null

  // "Happy Birthday to Sarah, Ben & Leo! Let's celebrate!"
  const names = data.items.map((p) => (p.isYou ? 'you' : firstName(p.name)))
  const extra = data.total - data.items.length
  const nameList =
    extra > 0
      ? `${names.join(', ')} & ${extra} more`
      : names.length > 1
        ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
        : names[0]

  const headline = person.isYou ? (
    <>Happy <Highlight color="bg-orange-500">BIRTHDAY</Highlight>, <Highlight color="bg-pink-600">{first.toUpperCase()}</Highlight>! 🎉</>
  ) : (
    <>Join us to <Highlight color="bg-orange-500">CELEBRATE</Highlight> <Highlight color="bg-pink-600">{first.toUpperCase()}</Highlight> today!</>
  )
  const subline = person.isYou
    ? `The whole library is wishing you well${others > 0 ? `, and ${others} other${others === 1 ? ' is' : 's are'} celebrating with you today` : ''}.`
    : data.total > 1
      ? `Happy Birthday to ${nameList}! Let's celebrate!`
      : `It's ${first}'s birthday today. Send some love!`

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 60) (dx < 0 ? next : prev)()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Birthday celebration"
      data-celebration="birthday"
      className="fixed inset-0 z-[250] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm overflow-hidden"
      onClick={close}
    >
      <Confetti key={`confetti-${person.id}`} />

      <div
        className="rcf-pop relative w-full max-h-[94vh] overflow-hidden rounded-t-[28px] md:rounded-[32px] md:max-w-4xl bg-[#1b1d22] text-white shadow-2xl flex flex-col md:grid md:grid-cols-[1fr_1fr]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Photos and doodles: top on mobile, left on desktop */}
        <div className="relative flex-none h-[min(46vh,330px)] md:h-auto md:min-h-[540px] overflow-hidden">
          {data.items.length > 1 && (
            <div className="absolute top-4 left-5 right-16 flex gap-1.5 z-20">
              {data.items.map((p, i) => (
                <span key={p.id} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/25'}`} />
              ))}
            </div>
          )}
          <div className={`absolute right-3 z-20 flex items-center gap-2 ${data.items.length > 1 ? 'top-7' : 'top-3'}`}>
            {/* Music sits up here so it never covers the buttons below. */}
            <PopupMusicButton music={music} inline />
            <button
              onClick={close}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <Doodles />
          <p
            className="absolute left-[9%] top-[9%] z-10 text-[22px] md:text-[28px] leading-[1.05] text-white -rotate-[10deg] select-none"
            style={{ fontFamily: '"Permanent Marker", "Comic Sans MS", cursive' }}
          >
            LOVELY<br />CELEBRATIONS
          </p>
          {/* A little row of hearts along the top, clear of the photos and hat. */}
          <Heart className="absolute left-[52%] top-[8%] w-5 rotate-[-12deg]" />
          <Heart className="absolute left-[60%] top-[12%] w-6 rotate-[10deg]" />
          <Heart className="absolute left-[67%] top-[7%] w-4 rotate-[-4deg]" />

          <div key={person.id} className="absolute inset-0">
            <PhotoCollage items={data.items} index={index} />
          </div>
        </div>

        <div className="rcf-step overflow-y-auto px-6 pt-2 pb-6 md:px-10 md:py-10 flex flex-col md:justify-center">
          <h2 className="font-display text-[24px] md:text-[34px] leading-[1.35] font-extrabold tracking-tight text-center md:text-left break-words">
            {headline}
          </h2>
          <p className="font-body-md text-[14px] md:text-body-md text-white/80 mt-2 text-center md:text-left">{subline}</p>

          {/* Celebrant card: photo, full name, and the contacts they chose to share */}
          <div className="w-full mt-5 rounded-[22px] bg-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 flex-none rounded-full p-[2px] bg-gradient-to-br from-pink-500 to-orange-400">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#2a2d33] flex items-center justify-center">
                  {person.avatarUrl ? (
                    <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-body-md font-bold text-white">{first.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-grow">
                <p className="font-body-md text-body-md font-semibold text-white truncate">{person.name}{person.isYou ? ' (you)' : ''}</p>
                <p className="font-label-sm text-label-sm text-pink-400">🎂 Celebrating today</p>
              </div>
            </div>
            {hasContact && (
              <div className="flex flex-col sm:flex-row gap-2 px-3 pb-3">
                {person.phone && (
                  <a href={`tel:+${digitsOnly(person.phone)}`} className="flex-1 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] transition-colors min-w-0">
                    <span className="w-8 h-8 flex-none rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-white/60">Phone</span>
                      <span className="block font-label-md text-label-md text-white truncate">{person.phone}</span>
                    </span>
                  </a>
                )}
                {person.whatsapp && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] transition-colors min-w-0">
                    <span className="w-8 h-8 flex-none rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-white/60">WhatsApp</span>
                      <span className="block font-label-md text-label-md text-white truncate">{person.whatsapp}</span>
                    </span>
                  </a>
                )}
              </div>
            )}
          </div>

          {person.isYou && hasContact && (
            <p className="font-label-sm text-label-sm text-white/60 mt-3 text-center md:text-left">
              Your phone and WhatsApp are visible to other members today because you chose to share them. You can change this under Profile, then Birthday &amp; contact.
            </p>
          )}

          <div className="w-full mt-5 flex flex-col gap-2.5">
            {waLink && !person.isYou && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full bg-[#25D366] rcf-press text-white font-label-md text-label-md font-semibold text-center active:scale-[0.98] transition-transform shadow-lg shadow-[#25D366]/20"
              >
                Send wishes on WhatsApp
              </a>
            )}

            {data.items.length > 1 ? (
              <div className="flex gap-2.5">
                {index > 0 && (
                  <button onClick={prev} className="flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/15 rcf-press text-white font-label-md text-label-md">
                    Back
                  </button>
                )}
                <button
                  onClick={index < last ? next : close}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg rcf-press font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
                >
                  {index < last ? `Next (${index + 1} of ${data.items.length})` : 'Close'}
                </button>
              </div>
            ) : (
              <button
                onClick={close}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg rcf-press font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
              >
                Join the celebration 🎉
              </button>
            )}
          </div>

          {data.total > data.items.length && (
            <p className="font-label-sm text-label-sm text-white/60 mt-3 text-center md:text-left">
              +{data.total - data.items.length} more {data.total - data.items.length === 1 ? 'person is' : 'people are'} celebrating today
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

export default BirthdayCelebration
