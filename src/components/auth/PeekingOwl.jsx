// RCFMOUAULIBRARYreact/student-dashboard/src/components/auth/PeekingOwl.jsx
// The library owl peeking up from behind a row of books. Its eyes (and a
// little head tilt) follow the mouse. When the mouse rests for a moment it
// looks at the person, blinks twice quickly, now and then waves a wing, then
// goes back to watching the cursor. It also blinks on its own every few
// seconds. Everything is driven with refs + requestAnimationFrame, so the
// page never re-renders while it moves.
import { useEffect, useRef } from 'react'

const EYES = [
  { cx: 96, cy: 92 },
  { cx: 164, cy: 92 },
]
const PUPIL_TRAVEL = 8
const IDLE_MS = 2200

function PeekingOwl({ className = '' }) {
  const svgRef = useRef(null)
  const headRef = useRef(null)
  const pupilRefs = [useRef(null), useRef(null)]
  const lidRefs = [useRef(null), useRef(null)]
  const wingRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let cursor = null
    let lastMove = Date.now()
    let lookingAtUser = false
    let raf = 0
    const look = { x: 0, y: 0, tilt: 0 } // eased values
    const goal = { x: 0, y: 0, tilt: 0 }

    const blink = (times = 1) => {
      lidRefs.forEach((ref) =>
        ref.current?.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], {
          duration: times > 1 ? 170 : 220,
          iterations: times,
          easing: 'ease-in-out',
        })
      )
    }

    const wave = () => {
      wingRef.current?.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-42deg)' },
          { transform: 'rotate(-18deg)' },
          { transform: 'rotate(-42deg)' },
          { transform: 'rotate(-18deg)' },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 1300, easing: 'ease-in-out' }
      )
    }

    // Where to look: toward the cursor, or straight at the person.
    const aim = () => {
      if (lookingAtUser || !cursor) {
        goal.x = 0
        goal.y = lookingAtUser ? 2.5 : 0
        goal.tilt = 0
        return
      }
      const box = svg.getBoundingClientRect()
      const scale = box.width / 260
      // Average both eyes for one shared gaze (looks more natural).
      const ex = box.left + 130 * scale
      const ey = box.top + 92 * scale
      const dx = cursor.x - ex
      const dy = cursor.y - ey
      const dist = Math.hypot(dx, dy) || 1
      const reach = Math.min(dist / 160, 1) * PUPIL_TRAVEL
      goal.x = (dx / dist) * reach
      goal.y = (dy / dist) * reach
      goal.tilt = Math.max(-7, Math.min(7, dx / 60))
    }

    const frame = () => {
      aim()
      look.x += (goal.x - look.x) * 0.18
      look.y += (goal.y - look.y) * 0.18
      look.tilt += (goal.tilt - look.tilt) * 0.08
      const scale = lookingAtUser ? 1.12 : 1
      pupilRefs.forEach((ref) => {
        if (ref.current) ref.current.setAttribute('transform', `translate(${look.x.toFixed(2)} ${look.y.toFixed(2)}) scale(${scale})`)
      })
      if (headRef.current) headRef.current.style.transform = `rotate(${look.tilt.toFixed(2)}deg)`
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      cursor = { x: e.clientX, y: e.clientY }
      lastMove = Date.now()
      if (lookingAtUser) lookingAtUser = false
    }

    // Resting mouse: look at the person, blink twice, sometimes wave,
    // then look back at the cursor.
    let restTimer = 0
    const idleCheck = setInterval(() => {
      if (lookingAtUser || !cursor || Date.now() - lastMove < IDLE_MS) return
      lookingAtUser = true
      setTimeout(() => blink(2), 260)
      if (!reduce && Math.random() < 0.4) setTimeout(wave, 700)
      clearTimeout(restTimer)
      restTimer = setTimeout(() => {
        lookingAtUser = false
        lastMove = Date.now() // don't immediately repeat
      }, 2100)
    }, 300)

    // Ordinary blinks every 3.5-7 s.
    let blinkTimer = 0
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        if (!lookingAtUser) blink(1)
        scheduleBlink()
      }, 3500 + Math.random() * 3500)
    }
    scheduleBlink()

    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(frame)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      clearInterval(idleCheck)
      clearTimeout(blinkTimer)
      clearTimeout(restTimer)
    }
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <svg ref={svgRef} viewBox="0 0 260 190" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="owlBody" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#b8794a" />
          <stop offset="100%" stopColor="#6d4024" />
        </radialGradient>
        <radialGradient id="owlFace" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#fff4e2" />
          <stop offset="100%" stopColor="#f1d4ad" />
        </radialGradient>
      </defs>

      {/* waving wing, behind the body on the left */}
      <g ref={wingRef} style={{ transformBox: 'view-box', transformOrigin: '62px 136px' }}>
        <path d="M62 136 C34 128 22 150 28 176 C40 170 54 160 66 150 Z" fill="#5b331c" />
      </g>

      <g ref={headRef} style={{ transformBox: 'view-box', transformOrigin: '130px 190px' }}>
        {/* ear tufts */}
        <path d="M56 54 L62 14 L92 40 Z" fill="#7a4a2a" />
        <path d="M204 54 L198 14 L168 40 Z" fill="#7a4a2a" />
        {/* body + head */}
        <ellipse cx="130" cy="128" rx="94" ry="102" fill="url(#owlBody)" />
        {/* chest feathers */}
        <path d="M100 150 q8 8 16 0 q8 8 16 0 q8 8 16 0" stroke="#5a3218" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* face discs */}
        <circle cx="96" cy="92" r="36" fill="url(#owlFace)" />
        <circle cx="164" cy="92" r="36" fill="url(#owlFace)" />
        {/* eyes */}
        {EYES.map((eye, i) => (
          <g key={i}>
            <circle cx={eye.cx} cy={eye.cy} r="23" fill="#ffffff" stroke="#3b2414" strokeWidth="2.5" />
            <g ref={pupilRefs[i]}>
              <circle cx={eye.cx} cy={eye.cy} r="11" fill="#1b130c" />
              <circle cx={eye.cx + 4} cy={eye.cy - 4} r="3.6" fill="#ffffff" />
              <circle cx={eye.cx - 3} cy={eye.cy + 4} r="1.6" fill="#ffffff" opacity="0.7" />
            </g>
            {/* eyelid: scaled from 0 (open) to 1 (shut) to blink */}
            <ellipse
              ref={lidRefs[i]}
              cx={eye.cx}
              cy={eye.cy}
              rx="25"
              ry="25"
              fill="#c98b57"
              style={{ transformBox: 'fill-box', transformOrigin: 'top center', transform: 'scaleY(0)' }}
            />
          </g>
        ))}
        {/* beak */}
        <path d="M122 112 L138 112 L130 128 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
      </g>

      {/* the row of books it peeks over */}
      <g>
        <rect x="0" y="150" width="260" height="40" fill="#0d1622" />
        <rect x="6" y="148" width="34" height="42" rx="3" fill="#c2410c" />
        <rect x="11" y="156" width="24" height="3" rx="1.5" fill="#fed7aa" opacity="0.8" />
        <rect x="42" y="142" width="26" height="48" rx="3" fill="#0f766e" />
        <rect x="46" y="150" width="18" height="3" rx="1.5" fill="#99f6e4" opacity="0.7" />
        <rect x="70" y="152" width="44" height="38" rx="3" fill="#1e3a8a" />
        <rect x="76" y="160" width="32" height="3" rx="1.5" fill="#bfdbfe" opacity="0.7" />
        <rect x="116" y="146" width="30" height="44" rx="3" fill="#a16207" />
        <rect x="148" y="150" width="40" height="40" rx="3" fill="#7c2d12" />
        <rect x="154" y="158" width="28" height="3" rx="1.5" fill="#fdba74" opacity="0.8" />
        <rect x="190" y="144" width="28" height="46" rx="3" fill="#134e4a" />
        <rect x="220" y="153" width="36" height="37" rx="3" fill="#9a3412" />
        <rect x="226" y="161" width="24" height="3" rx="1.5" fill="#fed7aa" opacity="0.7" />
      </g>
    </svg>
  )
}

export default PeekingOwl
