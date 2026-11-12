// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/DownloadFx.jsx
// Mounted once in App. Two things, both driven by lib/downloadFx.js:
// 1. The first-download notice: files are kept inside the app's offline
//    storage, not the phone's Downloads / File Manager.
// 2. The "saved" moment: the book flies from the button into a little safe,
//    the door swings shut, the lock spins and a check pops. ~2 seconds.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NOTICE_EVENT, SAVED_EVENT } from '../../lib/downloadFx'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Safe({ doorRef, dialRef, size = 96 }) {
  return (
    <div className="relative" style={{ width: size, height: size * 0.86, perspective: 400 }}>
      {/* body */}
      <div className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-[#3b4a8f] to-[#1d2659] shadow-[0_12px_30px_rgba(22,35,94,0.45)] border border-white/10" />
      {/* open slot the book drops into */}
      <div className="absolute inset-[12%] rounded-[12px] bg-[#0d1235] shadow-inner flex items-end justify-center pb-[10%]">
        <span className="block w-[60%] h-[6%] rounded-full bg-[#5b7cfa]/40" />
      </div>
      {/* door, hinged on the left; starts open */}
      <div
        ref={doorRef}
        className="absolute inset-[6%] rounded-[14px] bg-gradient-to-br from-[#5b7cfa] to-[#3f51b5] border border-white/20 flex items-center justify-center"
        style={{ transformOrigin: 'left center', transform: 'rotateY(-115deg)', backfaceVisibility: 'hidden' }}
      >
        <div ref={dialRef} className="w-[42%] aspect-square rounded-full bg-white/90 border-4 border-[#c7d2fe] flex items-center justify-center">
          <span className="block w-[14%] h-[44%] rounded-full bg-[#3f51b5] -translate-y-[20%]" />
        </div>
        <span className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[6%] h-[30%] rounded-full bg-white/70" />
      </div>
      {/* feet */}
      <span className="absolute -bottom-1.5 left-[14%] w-[16%] h-2 rounded-b-md bg-[#141b45]" />
      <span className="absolute -bottom-1.5 right-[14%] w-[16%] h-2 rounded-b-md bg-[#141b45]" />
    </div>
  )
}

function OfflineNotice({ onAnswer }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="About offline downloads" className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => onAnswer(false)}>
      <div className="rcf-pop w-full max-w-sm rounded-[28px] bg-surface-container border border-outline shadow-2xl p-6 flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <div className="rcf-float mb-4">
          <Safe size={86} />
        </div>
        <h3 className="font-display text-[22px] font-extrabold text-on-surface">Your offline shelf</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Downloads are kept safely <span className="font-semibold text-on-surface">inside this app</span>, not in your phone's
          Downloads or File Manager. That keeps them light and ready without internet.
        </p>
        <div className="w-full mt-4 rounded-2xl bg-surface-container-high border border-outline p-3 text-left flex flex-col gap-2">
          {[
            ['offline_pin', 'Open them anytime from Downloads in the app, even offline.'],
            ['folder_off', "You won't find the file in your phone's gallery or file manager."],
            ['delete_sweep', 'Clearing the app or browser data removes them.'],
          ].map(([icon, text]) => (
            <p key={icon} className="flex items-start gap-2 font-label-md text-label-md text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] flex-none">{icon}</span>
              {text}
            </p>
          ))}
        </div>
        <button onClick={() => onAnswer(true)} className="rcf-press mt-5 w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">download</span>
          Got it, download
        </button>
        <button onClick={() => onAnswer(false)} className="mt-2 w-full h-11 rounded-full text-on-surface-variant font-label-md text-label-md">
          Not now
        </button>
      </div>
    </div>
  )
}

function SavedAnimation({ rect, title, onDone }) {
  const navigate = useNavigate()
  const bookRef = useRef(null)
  const safeWrapRef = useRef(null)
  const doorRef = useRef(null)
  const dialRef = useRef(null)
  // flying -> locked (door shut, check pops) -> leaving (safe shrinks away)
  // -> thinking (the thought cloud, on its own, until they close it).
  // Each step is scheduled from the moment the book lands, in order, so a
  // later step can never be overwritten by an earlier one (that race left
  // the safe stuck on screen with no cloud).
  const [stage, setStage] = useState('flying')
  const [closing, setClosing] = useState(false)

  // Cloud shrinks back into its bubbles, the bubbles pop away in reverse.
  const dismiss = (then) => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      onDone()
      then?.()
    }, reduceMotion() ? 0 : 760)
  }

  useEffect(() => {
    const safe = safeWrapRef.current
    const book = bookRef.current
    if (!safe || !book) return undefined
    const timers = []
    const later = (ms, fn) => timers.push(setTimeout(fn, ms))

    if (reduceMotion()) {
      doorRef.current.style.transform = 'rotateY(0deg)'
      setStage('thinking')
      return () => timers.forEach(clearTimeout)
    }

    safe.animate([{ transform: 'translateY(40px) scale(0.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
      duration: 320,
      easing: 'cubic-bezier(0.2,0.9,0.3,1.3)',
      fill: 'both',
    })

    // Fly along an arc from the button into the safe's slot.
    const target = safe.getBoundingClientRect()
    const to = { x: target.left + target.width / 2, y: target.top + target.height * 0.45 }
    const start = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }
    const peak = { x: (start.x + to.x) / 2 + (start.x > to.x ? 40 : -40), y: Math.min(start.y, to.y) - 140 }
    const at = (p) => `translate(${p.x - 22}px, ${p.y - 28}px)`
    const fly = book.animate(
      [
        { transform: `${at(start)} scale(0.6) rotate(0deg)`, opacity: 0 },
        { transform: `${at(start)} scale(1.1) rotate(-8deg)`, opacity: 1, offset: 0.15 },
        { transform: `${at(peak)} scale(1) rotate(-200deg)`, offset: 0.55 },
        { transform: `${at(to)} scale(0.45) rotate(-360deg)`, opacity: 1, offset: 0.92 },
        { transform: `${at(to)} scale(0.2) rotate(-360deg)`, opacity: 0 },
      ],
      { duration: 900, delay: 180, easing: 'cubic-bezier(0.45,0,0.25,1)', fill: 'both' }
    )

    fly.onfinish = () => {
      doorRef.current?.animate([{ transform: 'rotateY(-115deg)' }, { transform: 'rotateY(8deg)' }, { transform: 'rotateY(0deg)' }], {
        duration: 380,
        easing: 'ease-out',
        fill: 'forwards',
      })
      dialRef.current?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(270deg)' }], { duration: 520, delay: 300, easing: 'cubic-bezier(0.3,1.4,0.5,1)', fill: 'forwards' })
      safe.animate([{ transform: 'none' }, { transform: 'scale(1.08) rotate(-2deg)' }, { transform: 'scale(0.98) rotate(1deg)' }, { transform: 'none' }], { duration: 420, delay: 300 })
      later(650, () => setStage('locked'))      // check + sparkles
      later(1700, () => setStage('leaving'))    // safe shrinks away
      later(2150, () => setStage('thinking'))   // then the thought cloud
    }
    return () => {
      fly.cancel()
      timers.forEach(clearTimeout)
    }
  }, [rect])

  const thinking = stage === 'thinking'
  const locked = stage === 'locked'
  const safeGone = stage === 'leaving' || thinking

  return (
    <div
      className="fixed inset-0 z-[320] pointer-events-none"
      aria-live="polite"
      role={thinking ? 'dialog' : undefined}
      aria-modal={thinking ? 'true' : undefined}
      aria-label={thinking ? 'Your book is saved for offline reading' : undefined}
    >
      {/* soft dim so they can stop and read; tapping it closes the cloud */}
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-500 ${thinking && !closing ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
        onClick={() => dismiss()}
      />
      {/* the flying book */}
      <div ref={bookRef} className="absolute left-0 top-0 w-11 h-14 rounded-[8px] bg-gradient-to-br from-orange-400 to-amber-500 shadow-xl flex items-center justify-center" style={{ opacity: 0 }}>
        <span className="material-symbols-outlined text-white text-[24px]">menu_book</span>
        <span className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-black/15" />
      </div>

      {/* the thought cloud, centred, once the safe has gone */}
      {thinking && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <ThoughtCloud title={title} closing={closing} onClose={() => dismiss()} onOpen={() => dismiss(() => navigate('/downloads'))} />
        </div>
      )}

      <div className={`absolute left-1/2 -translate-x-1/2 bottom-[112px] md:bottom-16 flex flex-col items-center ${safeGone ? 'rcf-safe-leave' : ''}`}>
        <div ref={safeWrapRef} className="relative">
          <Safe doorRef={doorRef} dialRef={dialRef} />
          {locked && (
            <>
              <span className="rcf-pop absolute -top-3 -right-3 w-9 h-9 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center ring-4 ring-background">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
              </span>
              {['-left-6 -top-2', '-right-8 top-6', 'left-3 -top-7', 'right-2 -bottom-4'].map((pos, i) => (
                <span key={pos} className={`rcf-sparkle absolute ${pos} text-amber-300 text-[16px]`} style={{ animationDelay: `${i * 90}ms` }}>✦</span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Comic thought cloud, shown once the safe has gone: a small bubble, a bigger
// one, a bigger one again, then the biggest (the cloud with the words) puffs
// out. Closing plays it backwards. Shown after every download so nobody
// wonders where it went.
const CLOUD_FONT = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'
const PUFFS = [
  'left-5 -top-6 w-16 h-16',
  'left-[30%] -top-9 w-24 h-24',
  'right-7 -top-6 w-20 h-20',
  '-left-4 top-[30%] w-14 h-14',
  '-right-4 top-[22%] w-16 h-16',
  'left-9 -bottom-4 w-16 h-16',
  'left-[42%] -bottom-5 w-14 h-14',
  'right-10 -bottom-5 w-20 h-20',
]
// Same outline all round the union of the puffs, plus a soft shadow.
const CLOUD_OUTLINE =
  'drop-shadow(2.5px 0 0 #1f1a33) drop-shadow(-2.5px 0 0 #1f1a33) drop-shadow(0 2.5px 0 #1f1a33) drop-shadow(0 -2.5px 0 #1f1a33) drop-shadow(0 14px 22px rgba(0,0,0,0.35))'

function ThoughtCloud({ title, closing, onClose, onOpen }) {
  useEffect(() => {
    if (document.querySelector(`link[href="${CLOUD_FONT}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CLOUD_FONT
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // in: small -> medium -> big bubble, then the cloud. out: the reverse.
  const bubbles = [
    { size: 26, shift: 46, inDelay: 400, outDelay: 200 },
    { size: 16, shift: 26, inDelay: 200, outDelay: 320 },
    { size: 9, shift: 10, inDelay: 0, outDelay: 430 },
  ]
  const comic = { fontFamily: '"Patrick Hand", "Comic Sans MS", "Segoe Print", cursive' }

  return (
    <div className="pointer-events-auto flex flex-col items-center mb-1" onClick={(e) => e.stopPropagation()}>
      <div className={closing ? 'rcf-cloud-out' : 'rcf-cloud-in'} style={{ animationDelay: closing ? '0ms' : '620ms' }}>
        <div className="rcf-cloud-bob relative w-[min(330px,calc(100vw-40px))] mt-10" style={{ filter: CLOUD_OUTLINE }}>
          {PUFFS.map((p) => (
            <span key={p} className={`absolute ${p} rounded-full bg-white`} aria-hidden="true" />
          ))}
          <div className="relative bg-white rounded-[46px] px-6 pt-5 pb-5 text-[#1f1a33]" style={comic}>
            <p className="text-[24px] leading-none text-center">Phew! It's safe 📚</p>
            {title && <p className="text-[15px] text-center text-[#6b6488] mt-1 truncate">"{title}"</p>}
            <ul className="mt-3 flex flex-col gap-1.5 text-[17px] leading-snug">
              <li className="flex gap-2"><span aria-hidden="true">📥</span><span>It's in <b>Downloads</b>, inside this app.</span></li>
              <li className="flex gap-2"><span aria-hidden="true">📴</span><span>Read it anytime <b>offline, with no data</b>. Try it with your data off!</span></li>
              <li className="flex gap-2"><span aria-hidden="true">🙈</span><span>You won't see it in your phone's file manager or gallery. It lives in the app.</span></li>
            </ul>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onOpen}
                className="rcf-press flex-1 h-11 rounded-full bg-[#1f1a33] text-white text-[17px]"
                style={comic}
              >
                Open Downloads
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rcf-press flex-1 h-11 rounded-full border-2 border-[#1f1a33] text-[#1f1a33] text-[17px]"
                style={comic}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* the trail of thought bubbles from the safe up to the cloud */}
      <div className="flex flex-col items-center gap-1.5 mt-4 mb-1">
        {bubbles.map((b) => (
          <span
            key={b.size}
            className={`block rounded-full bg-white ${closing ? 'rcf-bubble-out' : 'rcf-bubble-in'}`}
            style={{
              width: b.size,
              height: b.size,
              marginLeft: b.shift,
              boxShadow: '0 0 0 2.5px #1f1a33',
              animationDelay: `${closing ? b.outDelay : b.inDelay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function DownloadFx() {
  const [notice, setNotice] = useState(null)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    const onNotice = (e) => setNotice(() => e.detail.resolve)
    const onSaved = (e) => setSaved({ ...e.detail, key: Date.now() })
    window.addEventListener(NOTICE_EVENT, onNotice)
    window.addEventListener(SAVED_EVENT, onSaved)
    return () => {
      window.removeEventListener(NOTICE_EVENT, onNotice)
      window.removeEventListener(SAVED_EVENT, onSaved)
    }
  }, [])

  return (
    <>
      {notice && (
        <OfflineNotice
          onAnswer={(ok) => {
            notice(ok)
            setNotice(null)
          }}
        />
      )}
      {saved && <SavedAnimation key={saved.key} rect={saved.rect} title={saved.title} onDone={() => setSaved(null)} />}
    </>
  )
}

export default DownloadFx
