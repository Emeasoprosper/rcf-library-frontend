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
  const [stage, setStage] = useState('flying') // flying -> locked
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const onDone = () => doneRef.current()
    const safe = safeWrapRef.current
    const book = bookRef.current
    if (!safe || !book) return undefined
    const timers = []
    const finish = () => timers.push(setTimeout(onDone, 1900))

    if (reduceMotion()) {
      doorRef.current.style.transform = 'rotateY(0deg)'
      setStage('locked')
      finish()
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
      timers.push(setTimeout(() => setStage('locked'), 650))
      finish()
    }
    return () => {
      fly.cancel()
      timers.forEach(clearTimeout)
    }
  }, [rect])

  return (
    <div className="fixed inset-0 z-[320] pointer-events-none" aria-live="polite">
      {/* the flying book */}
      <div ref={bookRef} className="absolute left-0 top-0 w-11 h-14 rounded-[8px] bg-gradient-to-br from-orange-400 to-amber-500 shadow-xl flex items-center justify-center" style={{ opacity: 0 }}>
        <span className="material-symbols-outlined text-white text-[24px]">menu_book</span>
        <span className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-black/15" />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-[112px] md:bottom-16 flex flex-col items-center">
        <div ref={safeWrapRef} className="relative">
          <Safe doorRef={doorRef} dialRef={dialRef} />
          {stage === 'locked' && (
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
        <div className={`mt-4 transition-all duration-300 ${stage === 'locked' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface-container border border-outline shadow-2xl pl-4 pr-1.5 py-1.5">
            <span className="font-label-md text-label-md font-semibold text-on-surface max-w-[180px] truncate">
              Saved offline{title ? ` · ${title}` : ''}
            </span>
            <button
              type="button"
              onClick={() => { onDone(); navigate('/downloads') }}
              className="rcf-press h-8 px-3 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold"
            >
              View
            </button>
          </div>
        </div>
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
