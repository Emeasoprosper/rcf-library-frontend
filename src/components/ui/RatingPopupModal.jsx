import { useState } from 'react'
import { communityApi } from '../../services/api'

const STORAGE_KEY = 'rcf_last_rating_prompt'

export function shouldShowRatingPrompt() {
  try {
    const last = localStorage.getItem(STORAGE_KEY)
    if (!last) return true
    const oneDayMs = 24 * 60 * 60 * 1000
    return Date.now() - Number(last) > oneDayMs
  } catch {
    return false
  }
}

export function markRatingPromptShown() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
}

// Gold 3D-ish star — layered gradient fill + outer glow + a drop shadow
// that shifts on hover/selection, so it reads as a lit, dimensional
// object instead of a flat icon.
function GoldStar({ filled, hovered, size = 40 }) {
  const active = filled || hovered
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        filter: active ? 'drop-shadow(0 2px 6px rgba(234,179,8,0.65))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
        transition: 'transform 150ms ease, filter 150ms ease',
        transform: hovered ? 'scale(1.15) rotate(-4deg)' : 'scale(1)',
      }}
    >
      <defs>
        <linearGradient id="goldStarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? '#FFE066' : '#4C4546'} />
          <stop offset="45%" stopColor={active ? '#FFC53D' : '#4C4546'} />
          <stop offset="100%" stopColor={active ? '#E8960C' : '#3a3536'} />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 6.4 6.95.9-5.2 4.75 1.45 6.95L12 17.9l-6.15 3.6 1.45-6.95-5.2-4.75 6.95-.9z"
        fill="url(#goldStarFill)"
        stroke={active ? '#B8860B' : 'transparent'}
        strokeWidth="0.5"
      />
    </svg>
  )
}

function RatingPopupModal({ open, onClose }) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const handleSubmit = async (value) => {
    setStars(value)
    try {
      await communityApi.submitRating(value)
      setSubmitted(true)
      setTimeout(onClose, 1200)
    } catch {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-margin-mobile" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl p-stack-lg text-center border border-outline overflow-hidden relative"
        style={{
          background: 'radial-gradient(circle at 20% 0%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 85% 100%, rgba(250,204,21,0.18), transparent 55%), radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12), transparent 70%), var(--color-surface-container)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <>
            <span className="material-symbols-outlined text-primary text-5xl mb-2">celebration</span>
            <p className="font-headline-md text-headline-md text-on-surface">Thanks for your feedback!</p>
          </>
        ) : (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Enjoying RCF Library?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Rate your experience</p>
            <div className="flex justify-center gap-1.5 mb-stack-md" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSubmit(n)}
                  onMouseEnter={() => setHovered(n)}
                  aria-label={`${n} stars`}
                  className="p-1"
                >
                  <GoldStar filled={n <= stars} hovered={n <= hovered} />
                </button>
              ))}
            </div>
            <button onClick={onClose} className="font-label-md text-label-md text-on-surface-variant">Maybe later</button>
          </>
        )}
      </div>
    </div>
  )
}

export default RatingPopupModal