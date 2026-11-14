// RCFMOUAULIBRARYreact/student-dashboard/src/components/auth/CursorTrail.jsx
// A soft glowing trail that follows the mouse: each dot chases the one in
// front of it, so the tail curves and settles behind the cursor. Only on
// devices with a real mouse, never with "reduce motion", never blocks clicks.
import { useEffect, useRef, useState } from 'react'

const COUNT = 14

function CursorTrail() {
  const dots = useRef([])
  const [enabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (!enabled) return undefined
    const target = { x: -100, y: -100 }
    const points = Array.from({ length: COUNT }, () => ({ x: -100, y: -100 }))
    let seen = false
    let lastMove = 0
    let raf = 0

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      lastMove = performance.now()
      if (!seen) {
        seen = true
        points.forEach((p) => { p.x = target.x; p.y = target.y })
      }
    }
    const onLeave = () => { seen = false }

    const frame = (now) => {
      // The tail fades away when the mouse rests.
      const fade = seen ? Math.max(0, 1 - Math.max(0, now - lastMove - 600) / 900) : 0
      points.forEach((p, i) => {
        const lead = i === 0 ? target : points[i - 1]
        const k = i === 0 ? 0.45 : 0.42
        p.x += (lead.x - p.x) * k
        p.y += (lead.y - p.y) * k
        const el = dots.current[i]
        if (el) {
          const t = 1 - i / COUNT
          el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${(0.35 + t * 0.65).toFixed(3)})`
          el.style.opacity = String((t * 0.85 * fade).toFixed(3))
        }
      })
      raf = requestAnimationFrame(frame)
    }

    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(frame)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => {
        // warm orange at the head fading to teal at the tail
        const hue = 28 + (i / COUNT) * 150
        const size = i === 0 ? 16 : 12
        return (
          <span
            key={i}
            ref={(el) => { dots.current[i] = el }}
            className="absolute left-0 top-0 rounded-full"
            style={{
              width: size,
              height: size,
              opacity: 0,
              background: `hsl(${hue} 95% 60%)`,
              boxShadow: `0 0 ${i === 0 ? 18 : 10}px hsl(${hue} 95% 60% / 0.8)`,
              mixBlendMode: 'screen',
              willChange: 'transform, opacity',
            }}
          />
        )
      })}
    </div>
  )
}

export default CursorTrail
