// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/AmbientOwl.jsx
// A little reward for staying: every 5 minutes someone spends in the app
// (tab visible), the library owl flies across the screen from one random
// edge to another. Never blocks taps, never shows during popups, and is
// skipped entirely for people who turned on "reduce motion".
import { useEffect, useRef, useState } from 'react'
import { OwlArt } from './Illustrations'

const EVERY_MS = 5 * 60 * 1000
const TICK_MS = 15 * 1000
const FLIGHT_MS = 7000

function randomFlight() {
  const w = window.innerWidth
  const h = window.innerHeight
  const fromLeft = Math.random() < 0.5
  const y1 = h * (0.15 + Math.random() * 0.55)
  const y2 = h * (0.1 + Math.random() * 0.6)
  const start = { x: fromLeft ? -140 : w + 40, y: y1 }
  const end = { x: fromLeft ? w + 40 : -140, y: y2 }
  // A gentle arc: the middle of the flight dips or rises a bit.
  const mid = { x: (start.x + end.x) / 2, y: (y1 + y2) / 2 + (Math.random() < 0.5 ? -1 : 1) * h * 0.12 }
  return { start, mid, end, flip: !fromLeft }
}

function AmbientOwl() {
  const [flight, setFlight] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let visibleMs = 0
    const timer = setInterval(() => {
      if (document.hidden) return
      visibleMs += TICK_MS
      if (visibleMs < EVERY_MS) return
      // Wait for a quiet moment: no popup open.
      if (document.querySelector('[role="dialog"]')) return
      visibleMs = 0
      setFlight({ ...randomFlight(), id: Date.now() })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!flight || !el) return undefined
    const { start, mid, end, flip } = flight
    const sx = flip ? -1 : 1
    const anim = el.animate(
      [
        { transform: `translate(${start.x}px, ${start.y}px) scaleX(${sx}) rotate(4deg)` },
        { transform: `translate(${mid.x}px, ${mid.y}px) scaleX(${sx}) rotate(-3deg)` },
        { transform: `translate(${end.x}px, ${end.y}px) scaleX(${sx}) rotate(5deg)` },
      ],
      { duration: FLIGHT_MS, easing: 'ease-in-out', fill: 'forwards' }
    )
    anim.onfinish = () => setFlight(null)
    return () => anim.cancel()
  }, [flight])

  if (!flight) return null
  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden" aria-hidden="true">
      <div ref={ref} className="absolute top-0 left-0 w-[100px] drop-shadow-lg" style={{ willChange: 'transform' }}>
        <OwlArt className="w-full" />
      </div>
    </div>
  )
}

export default AmbientOwl
