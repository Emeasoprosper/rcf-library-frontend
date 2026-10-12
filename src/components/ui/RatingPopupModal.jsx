import { useState, useEffect } from 'react'
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

const SLOT = 52
const STAR_IDS = [0, 1, 2, 3, 4]
const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent!']

// Each star owns its own gradient id — a shared id made the first star's
// colour paint every star.
function StarIcon({ id, lit, size = 40 }) {
  const gradId = `rating-gold-${id}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        filter: lit ? 'drop-shadow(0 2px 6px rgba(234,179,8,0.65))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
        transition: 'filter 250ms ease',
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="45%" stopColor="#FFC53D" />
          <stop offset="100%" stopColor="#E8960C" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 6.4 6.95.9-5.2 4.75 1.45 6.95L12 17.9l-6.15 3.6 1.45-6.95-5.2-4.75 6.95-.9z"
        fill={lit ? `url(#${gradId})` : '#5A5355'}
        stroke={lit ? '#B8860B' : 'transparent'}
        strokeWidth="0.5"
      />
    </svg>
  )
}

function RatingPopupModal({ open, onClose }) {
  // selected = ids of the gold stars, in the order they were tapped.
  const [selected, setSelected] = useState([])
  const [pops, setPops] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | error | done

  useEffect(() => {
    if (open) {
      setSelected([])
      setPops({})
      setStatus('idle')
    }
  }, [open])

  if (!open) return null

  // Gold stars cluster on the left (slots 0..n-1); the rest sit after them.
  const slotOf = (id) => {
    const goldIndex = selected.indexOf(id)
    if (goldIndex !== -1) return goldIndex
    const unlit = STAR_IDS.filter((s) => !selected.includes(s))
    return selected.length + unlit.indexOf(id)
  }

  const toggle = (id) => {
    if (status === 'sending' || status === 'done') return
    const turningOn = !selected.includes(id)
    setStatus('idle')
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
    if (turningOn) setPops((p) => ({ ...p, [id]: (p[id] || 0) + 1 }))
  }

  const handleSubmit = async () => {
    if (selected.length === 0) return
    setStatus('sending')
    try {
      await communityApi.submitRating(selected.length)
      setStatus('done')
      setTimeout(onClose, 1400)
    } catch {
      setStatus('error')
    }
  }

  return (
    // Desktop: above every other popup (z-2000). Mobile: normal layer.
    // No backdrop-click close — dismissing other popups (like the network
    // toast) must never close this one.
    <div className="fixed inset-0 z-[200] md:z-[2000] flex items-center justify-center bg-black/60 px-margin-mobile">
      <style>{`
        @keyframes ratingStarPop {
          0% { transform: scale(1) rotate(0deg); }
          45% { transform: scale(1.4) rotate(-12deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes ratingCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        data-priority-popup
        className="w-full max-w-sm rounded-2xl p-stack-lg text-center border border-outline overflow-hidden relative"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 85% 100%, rgba(250,204,21,0.18), transparent 55%), radial-gradient(circle at 0% 60%, rgba(59,130,246,0.2), transparent 60%), var(--color-surface-container)',
          animation: 'ratingCardIn 260ms ease-out',
        }}
      >
        {status === 'done' ? (
          <>
            <span className="material-symbols-outlined text-amber-400 text-5xl mb-2">celebration</span>
            <p className="font-headline-md text-headline-md text-on-surface">Thanks for your feedback!</p>
          </>
        ) : (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">Enjoying RCF Library?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Tap the stars to rate</p>

            <div className="relative mx-auto mb-2" style={{ width: SLOT * 5, height: SLOT }}>
              {STAR_IDS.map((id) => {
                const lit = selected.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={lit}
                    aria-label={`Star ${id + 1}`}
                    className="group absolute top-0 left-0 flex items-center justify-center"
                    style={{
                      width: SLOT,
                      height: SLOT,
                      transform: `translateX(${slotOf(id) * SLOT}px)`,
                      transition: 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <span className="transition-transform duration-150 group-hover:scale-110">
                      <span
                        key={pops[id] || 0}
                        style={{
                          display: 'inline-flex',
                          animation: lit && pops[id] ? 'ratingStarPop 380ms ease-out' : undefined,
                        }}
                      >
                        <StarIcon id={id} lit={lit} />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="font-label-md text-label-md text-amber-300 h-5 mb-stack-sm">
              {selected.length ? LABELS[selected.length - 1] : ''}
            </p>

            {status === 'error' && (
              <p className="font-label-sm text-label-sm text-rose-300 mb-2">
                Couldn't send your rating. Check your connection and try again.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 || status === 'sending'}
              className="w-full h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-label-lg text-label-lg font-semibold active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-2"
            >
              {status === 'sending' ? 'Sending…' : status === 'error' ? 'Try again' : 'Submit rating'}
            </button>

            <button onClick={onClose} className="font-label-md text-label-md text-sky-300 hover:text-sky-200">
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default RatingPopupModal