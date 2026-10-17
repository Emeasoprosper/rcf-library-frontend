// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BirthdayCelebration.jsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { birthdaysApi } from '../../services/api'
import usePopupMusic from '../../hooks/usePopupMusic'
import PopupMusicButton from './PopupMusicButton'

const SEEN_KEY = 'rcf_birthday_seen'
const MUSIC_SRC = '/birthday-music.mp3'
const CONFETTI_COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#22c55e', '#eab308', '#3b82f6']
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${((i * 53) % 45) / 10}s`,
  duration: `${4 + ((i * 29) % 30) / 10}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))

const CSS = `
@keyframes bdFall { 0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: .9; } }
@keyframes bdPop { 0% { transform: scale(.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.bd-confetti { position: absolute; top: 0; width: 8px; height: 14px; border-radius: 2px; animation: bdFall linear infinite; }
.bd-card { animation: bdPop .28s ease-out both; }
@media (prefers-reduced-motion: reduce) { .bd-confetti { display: none; } .bd-card { animation: none; } }
`

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
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden"
      onClick={close}
    >
      <style>{CSS}</style>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="bd-confetti"
            style={{ left: c.left, background: c.color, animationDelay: c.delay, animationDuration: c.duration }}
          />
        ))}
      </div>

      <div
        key={person.id}
        className="bd-card relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-3xl bg-surface-container border border-outline shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 px-5 pt-4 pb-14 text-white">
          {data.items.length > 1 && (
            <div className="flex gap-1.5 mb-3">
              {data.items.map((p, i) => (
                <span key={p.id} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="font-label-sm text-label-sm uppercase tracking-wide">
              {data.total > 1 ? `${data.total} people are celebrating today` : 'Birthday today'}
            </span>
            <button
              onClick={close}
              aria-label="Close"
              className="w-9 h-9 flex-none rounded-full bg-black/30 flex items-center justify-center active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="px-5 -mt-12 pb-5 flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-orange-400 to-pink-500 ring-4 ring-surface-container">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-headline-lg text-headline-lg font-display text-on-surface">{first.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-xl">🎂</span>
          </div>

          <h2 className="font-headline-md text-headline-md font-display text-on-surface mt-3 break-words">{title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{subtitle}</p>
          {!person.isYou && <p className="font-label-md text-label-md text-on-surface mt-1 truncate max-w-full">{person.name}</p>}

          {hasContact && !person.isYou && (
            <div className="w-full mt-4 rounded-2xl border border-outline bg-surface-container-low p-3 text-left flex flex-col gap-2">
              {person.phone && (
                <a href={`tel:+${digitsOnly(person.phone)}`} className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                  <span className="font-body-md text-body-md">{person.phone}</span>
                </a>
              )}
              {person.whatsapp && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">chat</span>
                  <span className="font-body-md text-body-md">{person.whatsapp} (WhatsApp)</span>
                </a>
              )}
            </div>
          )}

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
                className="w-full py-3.5 rounded-lg bg-[#25D366] text-white font-label-md text-label-md font-semibold text-center active:scale-[0.98] transition-transform"
              >
                Send wishes on WhatsApp
              </a>
            )}

            {data.items.length > 1 ? (
              <div className="flex gap-2">
                {index > 0 && (
                  <button onClick={prev} className="flex-1 py-3.5 rounded-lg border border-outline text-on-surface font-label-md text-label-md">
                    Back
                  </button>
                )}
                <button
                  onClick={index < last ? next : close}
                  className="flex-1 py-3.5 rounded-lg bg-orange-500 text-white font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
                >
                  {index < last ? `Next (${index + 1} of ${data.items.length})` : 'Close'}
                </button>
              </div>
            ) : (
              <button
                onClick={close}
                className="w-full py-3.5 rounded-lg bg-orange-500 text-white font-label-md text-label-md font-semibold active:scale-[0.98] transition-transform"
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