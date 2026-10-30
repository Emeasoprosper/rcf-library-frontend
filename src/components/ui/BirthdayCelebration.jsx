// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayCelebration.jsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { birthdaysApi } from '../../services/api'
import usePopupMusic from '../../hooks/usePopupMusic'
import PopupMusicButton from './PopupMusicButton'

import { Confetti, CakeArt } from './Celebrate'

const SEEN_KEY = 'rcf_birthday_seen'
// The happy-birthday song in /public. (The old path pointed at a file that
// was never added, so the popup played nothing.)
const MUSIC_SRC = '/sub_clair-happy-birthday-592177.mp3'

const lagosDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'friend'
const digitsOnly = (s) => String(s || '').replace(/\D/g, '')

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

  const title = person.isYou ? `Happy Birthday, ${first}! 🎉` : `Join us as we celebrate ${first}!`
  const subtitle = person.isYou
    ? `The whole library is wishing you well${others > 0 ? `, and ${others} other${others === 1 ? ' is' : 's are'} celebrating with you today` : ''}.`
    : `${first}'s birthday is today. Send some love.`

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
        key={person.id}
        className="rcf-pop relative w-full max-h-[94vh] overflow-hidden rounded-t-[28px] md:rounded-[32px] md:max-w-4xl bg-surface-container border border-outline shadow-2xl flex flex-col md:grid md:grid-cols-[0.95fr_1.05fr]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Picture: top on mobile, left on desktop */}
        <div className="rcf-gradient relative bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex flex-col items-center justify-center flex-none h-[34vh] min-h-[220px] md:h-auto md:min-h-[520px] overflow-hidden text-white">
          <span className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute bottom-10 -right-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
          {data.items.length > 1 && (
            <div className="absolute top-4 left-5 right-16 flex gap-1.5">
              {data.items.map((p, i) => (
                <span key={p.id} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <CakeArt className="w-[46%] max-w-[200px] md:w-[62%] md:max-w-[300px] drop-shadow-2xl" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:mt-2">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] bg-white/80 shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-headline-lg text-headline-lg font-display text-on-surface">{first.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rcf-step overflow-y-auto px-6 pt-6 pb-6 md:px-10 md:py-10 flex flex-col">
          <span className="self-start px-3 py-1 rounded-full bg-pink-500/15 text-pink-500 font-label-sm text-label-sm uppercase tracking-wide">
            {data.total > 1 ? `${data.total} people celebrating today` : 'Birthday today 🎉'}
          </span>
          <h2 className="font-display text-[30px] md:text-[42px] leading-[1.05] font-extrabold tracking-tight text-on-surface mt-3 break-words">
            {title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{subtitle}</p>
          {/* Celebrant card: photo, full name, and the contacts they chose to share */}
          <div className="w-full mt-5 rounded-2xl border border-outline bg-surface-container-low overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 flex-none rounded-full p-[2px] bg-gradient-to-br from-pink-500 to-orange-400">
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                  {person.avatarUrl ? (
                    <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-body-md font-bold text-on-surface">{first.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-grow">
                <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{person.name}{person.isYou ? ' (you)' : ''}</p>
                <p className="font-label-sm text-label-sm text-pink-500">🎂 Celebrating today</p>
              </div>
            </div>
            {hasContact && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-outline/60 border-t border-outline/60">
                {person.phone && (
                  <a href={`tel:+${digitsOnly(person.phone)}`} className="flex items-center gap-2.5 px-3 py-3 bg-surface-container-low hover:bg-surface-container-high transition-colors min-w-0">
                    <span className="w-8 h-8 flex-none rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">Phone</span>
                      <span className="block font-label-md text-label-md text-on-surface truncate">{person.phone}</span>
                    </span>
                  </a>
                )}
                {person.whatsapp && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-3 bg-surface-container-low hover:bg-surface-container-high transition-colors min-w-0">
                    <span className="w-8 h-8 flex-none rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">WhatsApp</span>
                      <span className="block font-label-md text-label-md text-on-surface truncate">{person.whatsapp}</span>
                    </span>
                  </a>
                )}
              </div>
            )}
          </div>

          {person.isYou && hasContact && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
              Your phone and WhatsApp are visible to other members today because you chose to share them. You can change this under Profile, then Birthday &amp; contact.
            </p>
          )}

          <div className="w-full mt-5 flex flex-col gap-2">
            {waLink && !person.isYou && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-[#25D366] rcf-press text-white font-label-md text-label-md font-semibold text-center active:scale-[0.98] transition-transform"
              >
                Send wishes on WhatsApp
              </a>
            )}

            {data.items.length > 1 ? (
              <div className="flex gap-2">
                {index > 0 && (
                  <button onClick={prev} className="flex-1 py-3.5 rounded-2xl border border-outline rcf-press text-on-surface font-label-md text-label-md">
                    Back
                  </button>
                )}
                <button
                  onClick={index < last ? next : close}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg rcf-press font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
                >
                  {index < last ? `Next (${index + 1} of ${data.items.length})` : 'Close'}
                </button>
              </div>
            ) : (
              <button
                onClick={close}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg rcf-press font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
              >
                Join the celebration 🎉
              </button>
            )}
          </div>

          {data.total > data.items.length && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
              +{data.total - data.items.length} more {data.total - data.items.length === 1 ? 'person is' : 'people are'} celebrating today
            </p>
          )}
        </div>
      </div>

      <PopupMusicButton music={music} />
    </div>
  )
}

export default BirthdayCelebration