// RCFMOUAULIBRARYreact/student-dashboard/src/lib/shareQuote.js
// Turns a quote card into a PNG and shares it with a link back to the site,
// so every share works as a small advert. Phones get the system share sheet
// (WhatsApp, Instagram...); elsewhere the image downloads and the text is
// copied. Elements marked data-html2canvas-ignore (the buttons) are left out,
// and [data-share-footer] (the site address) only appears in the image.
import html2canvas from 'html2canvas'
import { fitCard } from './fitText'

export const SITE_URL = 'https://rcf-mouau-library.vercel.app'

async function cardToBlob(el) {
  const canvas = await html2canvas(el, {
    scale: Math.min(3, (window.devicePixelRatio || 1) * 1.5),
    backgroundColor: null,
    useCORS: true,
    // The image stays square too: show the site footer, then re-fit the quote around it.
    onclone: (doc, clone) => {
      clone.style.transform = 'none'
      clone.querySelectorAll('[data-share-footer]').forEach((n) => { n.style.display = 'block' })
      fitCard(clone)
    },
  })
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// Returns 'shared' | 'downloaded' | 'cancelled'.
export async function shareQuoteCard(el, { text, by }) {
  const message = `“${text}”\n— ${by}\n\nDaily verses and study tips on RCF MOUAU Library 📚\n${SITE_URL}`
  const blob = el ? await cardToBlob(el).catch(() => null) : null
  const file = blob ? new File([blob], 'rcf-daily-word.png', { type: 'image/png' }) : null

  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: message, url: SITE_URL })
      return 'shared'
    }
    if (navigator.share) {
      await navigator.share({ text: message, url: SITE_URL })
      return 'shared'
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled'
  }

  // Desktop fallback: save the image and copy the caption.
  if (blob) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'rcf-daily-word.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  try { await navigator.clipboard?.writeText(message) } catch { /* clipboard blocked */ }
  return 'downloaded'
}

// Hearts are remembered per device, per quote, per day.
const LIKE_KEY = 'rcf_quote_likes'

export function isLiked(id) {
  try { return (JSON.parse(localStorage.getItem(LIKE_KEY) || '[]')).includes(id) } catch { return false }
}

export function setLiked(id, liked) {
  try {
    const list = JSON.parse(localStorage.getItem(LIKE_KEY) || '[]').filter((x) => x !== id)
    if (liked) list.push(id)
    localStorage.setItem(LIKE_KEY, JSON.stringify(list.slice(-200)))
  } catch { /* storage blocked */ }
}
