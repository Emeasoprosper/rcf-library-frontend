// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/FeedbackPrompt.jsx
// Ratings, reviews and complaints. Mounted once in App; lib/feedbackMoments.js
// decides when it opens. A face peeks over the top of the sheet and reacts
// as stars are picked (frown at 1, beaming at 5); the stars sit on a smile-
// shaped arc beneath it. Picking stars unfolds quick tags, a review box and a
// "send as a complaint" switch. Sending makes the face wink and the stars
// fly up.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi } from '../../services/api'
import {
  FEEDBACK_EVENT,
  checkSessionMoment,
  markPromptShown,
  markSubmitted,
  recordVisitDay,
} from '../../lib/feedbackMoments'

const LABELS = ['Not good at all', 'Could be better', "It's okay", 'Really good', 'I love it!']
const GOOD_TAGS = ['Easy to find books', 'Offline reading', 'Looks great', 'Fast', 'Useful materials', 'Bro Paul helps']
const BAD_TAGS = ['Hard to find things', 'Slow to load', 'Download problems', 'Missing materials', 'Something crashed', 'Confusing to use']

const COPY = {
  first_download: ['How was your first download?', 'Your book is saved for offline reading. Did it go smoothly?'],
  first_upload: ['You shared your first resource!', 'How easy was uploading it?'],
  first_save: ['First book saved for later', "How's the library treating you so far?"],
  second_day: ['Welcome back 👋', "You've been here two days now. How is it going?"],
  regular: ['Quick one: how are we doing?', 'Your rating helps us make the library better for everyone.'],
  settings: ['Rate RCF Library', 'Tell us what you love, or what needs fixing.'],
  settings_complaint: ['Tell us what went wrong', "Pick how bad it was, then describe the problem. An admin will read it."],
}

// Pages where a popup would get in the way.
const QUIET_PATHS = [/^\/resources\/[^/]+\/read/, /^\/signin/, /^\/complete-profile/, /^\/admin/, /^\/onboarding/]

const OTHER_POPUP = '[role="dialog"]:not([data-feedback]), [role="alertdialog"], [data-priority-popup]'

// Smoothly follows `target` (for the face's mood).
function useTween(target, ms = 420) {
  const [value, setValue] = useState(target)
  const current = useRef(target)
  useEffect(() => {
    const from = current.current
    const start = performance.now()
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      current.current = from + (target - from) * eased
      setValue(current.current)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

// mood 0 = unhappy, 1 = delighted.
function Face({ mood, wink }) {
  const hue = 6 + mood * 42
  const mouthY = 80
  const ctrl = mouthY + (mood - 0.42) * 46
  const open = mood > 0.8
  const brow = (0.45 - mood) * 34 // degrees; only shown when sad
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.25)]" aria-hidden="true">
      <defs>
        <radialGradient id="fbFace" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0%" stopColor={`hsl(${hue} 95% 78%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 85% 55%)`} />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#fbFace)" />
      <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
      {/* cheeks */}
      <ellipse cx="32" cy="74" rx="9" ry="5.5" fill="#fb7185" opacity={0.15 + mood * 0.45} />
      <ellipse cx="88" cy="74" rx="9" ry="5.5" fill="#fb7185" opacity={0.15 + mood * 0.45} />
      {/* brows, sad only */}
      <g opacity={Math.max(0, (0.45 - mood) * 2.4)} stroke="#3b1d0f" strokeWidth="4" strokeLinecap="round">
        <line x1="34" y1="38" x2="50" y2="38" transform={`rotate(${-brow} 42 38)`} />
        <line x1="70" y1="38" x2="86" y2="38" transform={`rotate(${brow} 78 38)`} />
      </g>
      {/* eyes */}
      <ellipse cx="42" cy="54" rx="6" ry={6.5 + mood * 1.5} fill="#3b1d0f" />
      {wink ? (
        <path d="M71 55 Q78 49 85 55" stroke="#3b1d0f" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <ellipse cx="78" cy="54" rx="6" ry={6.5 + mood * 1.5} fill="#3b1d0f" />
      )}
      <circle cx="44" cy="51" r="1.8" fill="#fff" />
      {!wink && <circle cx="80" cy="51" r="1.8" fill="#fff" />}
      {/* mouth */}
      <path
        d={open ? `M38 ${mouthY} Q60 ${ctrl} 82 ${mouthY} Z` : `M40 ${mouthY} Q60 ${ctrl} 80 ${mouthY}`}
        stroke="#3b1d0f"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={open ? '#7c2d12' : 'none'}
      />
    </svg>
  )
}

function Star({ lit, size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.4 1.3-6.7-5-4.7 6.8-.8z"
        fill={lit ? '#fbbf24' : 'transparent'}
        stroke={lit ? '#d97706' : 'currentColor'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Stars on a smile-shaped arc under the face (angles in degrees, y down).
const ARC = [160, 125, 90, 55, 20]
const ARC_R = 104
const CX = 150
const CY = 64

function Sheet({ trigger, startAsComplaint, onClose }) {
  const [stars, setStars] = useState(0)
  const [pops, setPops] = useState(0)
  const [tags, setTags] = useState([])
  const [review, setReview] = useState('')
  const [complaint, setComplaint] = useState(Boolean(startAsComplaint))
  const [complaintTouched, setComplaintTouched] = useState(Boolean(startAsComplaint))
  const [status, setStatus] = useState('idle') // idle | sending | error | done
  const [leaving, setLeaving] = useState(false)

  const mood = useTween(stars ? (stars - 1) / 4 : 0.55)
  const [title, sub] = COPY[trigger] || COPY.regular
  const tagList = stars >= 4 ? GOOD_TAGS : BAD_TAGS

  const close = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    setTimeout(onClose, 380)
  }, [leaving, onClose])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  const pick = (n) => {
    if (status === 'sending' || status === 'done') return
    setStars(n)
    setPops((p) => p + 1)
    setStatus('idle')
    // Low scores lean towards a complaint, unless they've chosen themselves.
    if (!complaintTouched) setComplaint(n <= 2)
    // Tags belong to one side (good / bad); drop ones that no longer show.
    setTags((prev) => prev.filter((t) => (n >= 4 ? GOOD_TAGS : BAD_TAGS).includes(t)))
  }

  const toggleTag = (t) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const send = async () => {
    if (!stars || status === 'sending') return
    if (complaint && !review.trim() && tags.length === 0) {
      setStatus('need-detail')
      return
    }
    setStatus('sending')
    try {
      await communityApi.submitRating({ stars, review: review.trim() || undefined, kind: complaint ? 'complaint' : 'review', tags, trigger })
      markSubmitted()
      setStatus('done')
      setTimeout(close, 1900)
    } catch {
      setStatus('error')
    }
  }

  const done = status === 'done'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-feedback
      className={`fixed inset-0 z-[260] flex items-end md:items-center justify-center bg-black/55 backdrop-blur-[2px] ${leaving ? 'rcf-fb-fade-out' : 'rcf-fb-fade-in'}`}
      onClick={close}
    >
      <div
        className={`relative w-full md:max-w-[440px] bg-surface text-on-surface rounded-t-[34px] md:rounded-[34px] border-t md:border border-outline/70 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 ${leaving ? 'rcf-fb-sheet-out' : 'rcf-fb-sheet-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="md:hidden block mx-auto w-10 h-1 rounded-full bg-outline mb-1" aria-hidden="true" />
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* face peeking over the top edge, stars on the arc below it */}
        <div className="relative mx-auto -mt-[78px]" style={{ width: CX * 2, height: CY + ARC_R + 26 }}>
          <div className="rcf-fb-face absolute" style={{ left: CX - 56, top: CY - 56, width: 112, height: 112 }}>
            <div key={pops} className={pops ? 'rcf-fb-face-react w-full h-full' : 'w-full h-full'}>
              <Face mood={mood} wink={done} />
            </div>
          </div>
          {ARC.map((deg, i) => {
            const n = i + 1
            const rad = (deg * Math.PI) / 180
            const x = CX + ARC_R * Math.cos(rad)
            const y = CY + ARC_R * Math.sin(rad)
            const lit = n <= stars
            return (
              <button
                key={n}
                type="button"
                onClick={() => pick(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}: ${LABELS[i]}`}
                aria-pressed={lit}
                className={`absolute w-12 h-12 -ml-6 -mt-6 flex items-center justify-center rounded-full text-on-surface-variant/60 transition-transform hover:scale-110 ${done && lit ? 'rcf-fb-star-fly' : ''}`}
                style={{ left: x, top: y, animationDelay: done ? `${i * 70}ms` : undefined }}
              >
                <span
                  key={lit ? `on-${pops}` : 'off'}
                  className={lit ? 'rcf-fb-star-pop inline-flex' : 'inline-flex'}
                  style={{ animationDelay: lit ? `${i * 45}ms` : undefined }}
                >
                  <Star lit={lit} />
                </span>
              </button>
            )
          })}
          {done &&
            [0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="rcf-heart-float absolute text-[18px]" style={{ left: CX - 40 + i * 20, top: CY - 30, '--hx': `${(i - 2) * 14}px`, animationDelay: `${i * 90}ms` }}>
                {i % 2 ? '⭐' : '💛'}
              </span>
            ))}
        </div>

        <div className="text-center -mt-1">
          <p className={`h-5 font-label-md text-label-md font-semibold transition-colors ${stars >= 4 ? 'text-amber-500' : stars ? 'text-rose-400' : 'text-transparent'}`}>
            {stars ? LABELS[stars - 1] : '·'}
          </p>
          <h2 className="font-display text-[22px] leading-tight font-extrabold mt-2">{done ? 'Thank you!' : title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {done
              ? complaint
                ? "We've passed this to the admins. They'll look into it."
                : 'Your review helps make the library better for everyone.'
              : stars
                ? 'Anything you want to add?'
                : sub}
          </p>
        </div>

        {/* unfolds once a star is picked */}
        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${stars && !done ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="pt-4 flex flex-wrap gap-2 justify-center">
              {tagList.map((t, i) => {
                const on = tags.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`rcf-fb-chip px-3 h-8 rounded-full font-label-sm text-label-sm border transition-colors ${
                      on ? 'bg-on-surface text-surface border-on-surface' : 'border-outline text-on-surface-variant hover:border-on-surface-variant'
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            <textarea
              value={review}
              onChange={(e) => { setReview(e.target.value); if (status === 'need-detail') setStatus('idle') }}
              rows={3}
              maxLength={2000}
              placeholder={complaint ? 'What went wrong? The more detail, the faster we can fix it.' : 'Write a review (optional)'}
              className="mt-4 w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline/80 text-on-surface placeholder:text-on-surface-variant/70 text-[15px] focus:outline-none focus:border-on-surface-variant resize-none"
            />

            <button
              type="button"
              role="switch"
              aria-checked={complaint}
              onClick={() => { setComplaint((v) => !v); setComplaintTouched(true) }}
              className="mt-3 w-full flex items-center gap-3 text-left"
            >
              <span className={`relative w-10 h-6 flex-none rounded-full transition-colors ${complaint ? 'bg-rose-500' : 'bg-outline'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-[left] duration-200 ${complaint ? 'left-5' : 'left-1'}`} />
              </span>
              <span className="min-w-0">
                <span className="block font-label-md text-label-md text-on-surface">Send as a complaint</span>
                <span className="block font-label-sm text-label-sm text-on-surface-variant">Flags it for the admins to follow up</span>
              </span>
            </button>

            {status === 'need-detail' && (
              <p className="mt-2 font-label-sm text-label-sm text-rose-400">Please pick a tag or describe the problem so we can fix it.</p>
            )}
            {status === 'error' && (
              <p className="mt-2 font-label-sm text-label-sm text-rose-400">Couldn't send it. Check your connection and try again.</p>
            )}

            <button
              type="button"
              onClick={send}
              disabled={status === 'sending'}
              className={`rcf-press mt-4 w-full h-12 rounded-full font-label-lg text-label-lg font-semibold transition-colors disabled:opacity-60 ${
                complaint ? 'bg-rose-500 text-white' : 'bg-on-surface text-surface'
              }`}
            >
              {status === 'sending' ? 'Sending…' : complaint ? 'Send complaint' : 'Send review'}
            </button>
          </div>
        </div>

        {!stars && !done && (
          <button onClick={close} className="mt-4 mx-auto block font-label-md text-label-md text-on-surface-variant hover:text-on-surface">
            Not now
          </button>
        )}
      </div>
    </div>
  )
}

function FeedbackPrompt() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [active, setActive] = useState(null) // { trigger, complaint, key }
  const pathRef = useRef(location.pathname)
  useEffect(() => { pathRef.current = location.pathname }, [location.pathname])

  // Remember today as a day of use, and look for a moment after a while.
  useEffect(() => {
    if (!isAuthenticated) return undefined
    recordVisitDay()
    const timer = setTimeout(checkSessionMoment, 40000)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let waitTimer = null
    const onMoment = (e) => {
      const { trigger, manual, complaint } = e.detail || {}
      if (manual) {
        clearTimeout(waitTimer)
        setActive({ trigger, complaint, key: Date.now() })
        return
      }
      // Automatic: wait for a calm moment (no other popup, not reading).
      let tries = 0
      const attempt = () => {
        tries += 1
        const busy = document.querySelector(OTHER_POPUP) || QUIET_PATHS.some((re) => re.test(pathRef.current))
        if (!busy) {
          markPromptShown(trigger)
          setActive((cur) => cur || { trigger, complaint: false, key: Date.now() })
          return
        }
        if (tries < 60) waitTimer = setTimeout(attempt, 3000)
      }
      clearTimeout(waitTimer)
      waitTimer = setTimeout(attempt, 2500)
    }
    window.addEventListener(FEEDBACK_EVENT, onMoment)
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, onMoment)
      clearTimeout(waitTimer)
    }
  }, [isAuthenticated])

  if (!active) return null
  return <Sheet key={active.key} trigger={active.trigger} startAsComplaint={active.complaint} onClose={() => setActive(null)} />
}

export default FeedbackPrompt
