// RCFMOUAULIBRARYreact/student-dashboard/src/lib/fitText.js
// Keeps quote cards perfectly square on any screen: the card's size never
// changes, the quote text shrinks until it fits. Inside the card, mark the
// growing area with [data-fit-region] and the quote with [data-fit-text].
// Type starts at ~7.5% of the card width (so it scales with the phone) and
// steps down until nothing overflows.
import { useLayoutEffect } from 'react'

export function fitCard(card) {
  const region = card?.querySelector('[data-fit-region]')
  const text = card?.querySelector('[data-fit-text]')
  if (!region || !text) return
  const max = Math.max(14, card.clientWidth * 0.075)
  const min = 9
  let size = max
  text.style.fontSize = `${size}px`
  while (size > min && text.offsetHeight > region.clientHeight) {
    size -= 0.5
    text.style.fontSize = `${size}px`
  }
}

// Re-fits when the card is resized (rotation, sidebar, window) or the text changes.
export function useFitCard(ref, text) {
  useLayoutEffect(() => {
    const card = ref.current
    if (!card) return undefined
    fitCard(card)
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => fitCard(card))
    ro.observe(card)
    return () => ro.disconnect()
  }, [ref, text])
}
