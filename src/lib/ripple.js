export function createRipple(event) {
  const container = event.currentTarget
  if (!container) return

  const rect = container.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 1.6
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const ripple = document.createElement('span')
  Object.assign(ripple.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    background: 'rgba(255,255,255,0.35)',
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
  })

  container.appendChild(ripple)

  const animation = ripple.animate(
    [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(1)', opacity: 0 },
    ],
    { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  )
  animation.onfinish = () => ripple.remove()
}

// Fires the ripple, then hands off to whatever should happen after
// (usually a navigate() call) — delayed just enough that the ripple
// is visible before the page transitions away.
export function rippleThenNavigate(event, action, delay = 160) {
  createRipple(event)
  window.setTimeout(action, delay)
}