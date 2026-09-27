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

function RatingPopupModal({ open, onClose }) {
  const [stars, setStars] = useState(0)
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
      <div className="w-full max-w-sm rounded-2xl bg-surface-container p-stack-lg text-center" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <p className="font-headline-md text-headline-md text-on-surface">Thanks for your feedback!</p>
        ) : (
          <>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Enjoying RCF Library?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Rate your experience</p>
            <div className="flex justify-center gap-2 mb-stack-md">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => handleSubmit(n)} aria-label={`${n} stars`}>
                  <span className={`material-symbols-outlined text-3xl ${n <= stars ? 'text-orange-500' : 'text-on-surface-variant'}`}>
                    star
                  </span>
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