// RCFMOUAULIBRARYreact/student-dashboard/src/components/auth/PeekingOwl.jsx
// The library owl peeking up from behind a row of books (one of them wears
// the RCF logo). What it does:
//   - watches the cursor with its eyes and a little head tilt, blinking now
//     and then;
//   - mouse still for 1 minute: looks straight at the person, blinks twice
//     (sometimes waves), then goes back to watching the cursor;
//   - mouse spun round and round too fast: gets dizzy (eyes spin, head
//     wobbles), then shakes itself and recovers;
//   - password field in use (`covering`): covers its eyes with its wings,
//     uncovers when the person is done;
//   - mouse still for 5 minutes: falls asleep (eyes shut, head drooping,
//     floating z's) until the mouse moves again.
// Everything runs on refs + requestAnimationFrame, so the page never
// re-renders while it moves.
import { useEffect, useRef } from 'react'

const EYES = [
  { cx: 96, cy: 92 },
  { cx: 164, cy: 92 },
]
const PUPIL_TRAVEL = 8
const LOOK_AT_USER_AFTER_MS = 60 * 1000
const SLEEP_AFTER_MS = 5 * 60 * 1000
const DIZZY_SPIN_S = 2.2
const DIZZY_SHAKE_S = 0.7

// Shared shapes, drawn for the left side and mirrored for the right.
const EAR = 'M72 56 C66 40 58 22 55 4 C70 14 88 24 106 36 Z'
const EAR_INNER = 'M76 46 C70 34 64 22 62 14 C72 22 82 28 92 34'
const COVER_WING =
  'M58 122 C54 90 70 60 96 58 C122 60 136 88 132 120 C124 113 114 120 106 113 C97 121 87 113 79 121 C71 114 64 121 58 122 Z'

function PeekingOwl({ className = '', covering = false }) {
  const svgRef = useRef(null)
  const headRef = useRef(null)
  const pupilRefs = [useRef(null), useRef(null)]
  const lidRefs = [useRef(null), useRef(null)]
  const wingRef = useRef(null)
  const coverRefs = [useRef(null), useRef(null)]
  const zzzRef = useRef(null)
  const sleepEyesRef = useRef(null)
  const coveringRef = useRef(covering)
  const onCoverChange = useRef(() => {})

  useEffect(() => {
    coveringRef.current = covering
    onCoverChange.current(covering)
  }, [covering])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timers = new Set()
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }

    let cursor = null
    let lastMove = performance.now()
    let nextLookAt = lastMove + LOOK_AT_USER_AFTER_MS
    let mode = 'watch' // watch | lookUser | dizzy | sleep
    let modeStart = 0
    let dizzyCooldownUntil = 0
    let raf = 0
    const look = { x: 0, y: 0, tilt: 0 } // eased, shared by both eyes
    const goal = { x: 0, y: 0, tilt: 0 }

    // ---- small animations -------------------------------------------------
    const blink = (times = 1) => {
      if (mode === 'sleep') return
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

    const setLids = (shut) => {
      lidRefs.forEach((ref) => {
        if (!ref.current) return
        ref.current.style.transition = 'transform 700ms ease-in-out'
        ref.current.style.transform = shut ? 'scaleY(1)' : 'scaleY(0)'
      })
    }

    const setCover = (on) => {
      coverRefs.forEach((ref) => {
        if (ref.current) ref.current.style.transform = on ? 'translateY(0px)' : 'translateY(118px)'
      })
    }

    // ---- moods ------------------------------------------------------------
    const lookAtUser = () => {
      mode = 'lookUser'
      later(() => blink(2), 300)
      if (!reduce && Math.random() < 0.4) later(wave, 800)
      later(() => {
        if (mode !== 'lookUser') return
        mode = 'watch'
        nextLookAt = performance.now() + LOOK_AT_USER_AFTER_MS
      }, 2600)
    }

    const fallAsleep = () => {
      mode = 'sleep'
      setLids(true)
      if (sleepEyesRef.current) sleepEyesRef.current.style.opacity = '1'
      const z = zzzRef.current
      if (!z) return
      z.style.opacity = '1'
      if (reduce) return
      Array.from(z.children).forEach((el, i) =>
        el.animate(
          [
            { transform: 'translate(0px, 0px) scale(0.6)', opacity: 0 },
            { opacity: 1, offset: 0.3 },
            { transform: 'translate(14px, -34px) scale(1.15)', opacity: 0 },
          ],
          { duration: 2400, delay: i * 800, iterations: Infinity, easing: 'ease-out' }
        )
      )
    }

    const wakeUp = () => {
      const z = zzzRef.current
      if (z) {
        z.style.opacity = '0'
        Array.from(z.children).forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
      }
      if (sleepEyesRef.current) sleepEyesRef.current.style.opacity = '0'
      setLids(false)
      mode = 'watch'
      nextLookAt = performance.now() + LOOK_AT_USER_AFTER_MS
      later(() => blink(2), 750)
    }

    const getDizzy = () => {
      mode = 'dizzy'
      modeStart = performance.now()
    }

    onCoverChange.current = (on) => {
      if (on && mode === 'sleep') wakeUp()
      setCover(on)
      if (!on) later(() => blink(1), 420)
    }
    setCover(coveringRef.current)

    // ---- where to look ----------------------------------------------------
    const aim = () => {
      if (coveringRef.current) {
        // turned away from the password, eyes down
        goal.x = -5
        goal.y = 5
        goal.tilt = 0
        return
      }
      if (mode === 'sleep') {
        goal.x = 0
        goal.y = 3
        goal.tilt = 6 + Math.sin(performance.now() / 900) * 1.5 // slow breathing nod
        return
      }
      if (mode === 'lookUser' || !cursor) {
        goal.x = 0
        goal.y = mode === 'lookUser' ? 2.5 : 0
        goal.tilt = 0
        return
      }
      // Screen position of the point between the eyes, whatever the size.
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const ex = ctm.a * 130 + ctm.e
      const ey = ctm.d * 92 + ctm.f
      const dx = cursor.x - ex
      const dy = cursor.y - ey
      const dist = Math.hypot(dx, dy) || 1
      const reach = Math.min(dist / 160, 1) * PUPIL_TRAVEL
      goal.x = (dx / dist) * reach
      goal.y = (dy / dist) * reach
      goal.tilt = Math.max(-7, Math.min(7, dx / 60))
    }

    const placePupils = (offsets, scale) => {
      pupilRefs.forEach((ref, i) => {
        if (!ref.current) return
        const { cx, cy } = EYES[i]
        const [x, y] = offsets[i]
        // scale around the eye's own centre so the pupil never leaves the eye
        ref.current.setAttribute(
          'transform',
          `translate(${x.toFixed(2)} ${y.toFixed(2)}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`
        )
      })
    }

    const frame = () => {
      const now = performance.now()
      let tilt
      if (mode === 'dizzy' && !coveringRef.current) {
        const t = (now - modeStart) / 1000
        let offsets = [[0, 0], [0, 0]]
        if (t < DIZZY_SPIN_S) {
          // eyes spin in opposite circles, head wobbles
          const a = t * 14
          offsets = [
            [Math.cos(a) * 7, Math.sin(a) * 7],
            [Math.cos(-a + Math.PI) * 7, Math.sin(-a + Math.PI) * 7],
          ]
          tilt = Math.sin(t * 7) * 12
        } else if (t < DIZZY_SPIN_S + DIZZY_SHAKE_S) {
          // shakes itself back to its senses
          const s = (t - DIZZY_SPIN_S) / DIZZY_SHAKE_S
          tilt = 14 * Math.sin(s * Math.PI * 8) * (1 - s)
        } else {
          mode = 'watch'
          dizzyCooldownUntil = now + 4000
          nextLookAt = now + LOOK_AT_USER_AFTER_MS
          tilt = 0
          blink(2)
        }
        look.x = 0
        look.y = 0
        look.tilt = tilt
        placePupils(offsets, 1)
      } else {
        aim()
        look.x += (goal.x - look.x) * 0.18
        look.y += (goal.y - look.y) * 0.18
        look.tilt += (goal.tilt - look.tilt) * (mode === 'sleep' ? 0.03 : 0.08)
        tilt = look.tilt
        placePupils([[look.x, look.y], [look.x, look.y]], mode === 'lookUser' ? 1.12 : 1)
      }
      if (headRef.current) headRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`
      raf = requestAnimationFrame(frame)
    }

    // ---- the cursor ---------------------------------------------------------
    // Spin detection: add up how far the movement direction turns. Two full
    // turns within 1.5 s at speed = "round and round too fast".
    let samples = []
    let prev = null
    let prevAngle = null
    const onMove = (e) => {
      const now = performance.now()
      cursor = { x: e.clientX, y: e.clientY }
      lastMove = now
      if (mode === 'sleep') wakeUp()
      else if (mode === 'lookUser') {
        mode = 'watch'
        nextLookAt = now + LOOK_AT_USER_AFTER_MS
      } else if (mode === 'watch') nextLookAt = now + LOOK_AT_USER_AFTER_MS

      if (prev) {
        const vx = cursor.x - prev.x
        const vy = cursor.y - prev.y
        const step = Math.hypot(vx, vy)
        if (step >= 3) {
          const angle = Math.atan2(vy, vx)
          if (prevAngle !== null) {
            let turn = angle - prevAngle
            if (turn > Math.PI) turn -= 2 * Math.PI
            if (turn < -Math.PI) turn += 2 * Math.PI
            samples.push({ t: now, turn, step })
          }
          prevAngle = angle
        }
      }
      prev = cursor
      samples = samples.filter((s) => now - s.t < 1500)
      if (reduce || mode !== 'watch' || coveringRef.current || now < dizzyCooldownUntil) return
      let turned = 0
      let travelled = 0
      for (const s of samples) {
        turned += s.turn
        travelled += s.step
      }
      if (Math.abs(turned) >= 4 * Math.PI && travelled >= 1400) {
        samples = []
        getDizzy()
      }
    }

    // ---- idle clock -------------------------------------------------------
    const idleCheck = setInterval(() => {
      if (coveringRef.current) return
      const now = performance.now()
      if (mode === 'watch' && now - lastMove >= SLEEP_AFTER_MS) fallAsleep()
      else if (mode === 'watch' && now >= nextLookAt) lookAtUser()
    }, 500)

    // Ordinary blinks every 3.5-7 s while awake and watching.
    let blinkTimer = 0
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        if (mode === 'watch' && !coveringRef.current) blink(1)
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
      timers.forEach(clearTimeout)
      onCoverChange.current = () => {}
    }
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <svg ref={svgRef} viewBox="0 -14 260 204" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="owlBody" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#b8794a" />
          <stop offset="100%" stopColor="#6d4024" />
        </radialGradient>
        <radialGradient id="owlFace" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#fff4e2" />
          <stop offset="100%" stopColor="#f1d4ad" />
        </radialGradient>
        <linearGradient id="owlWing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5530" />
          <stop offset="100%" stopColor="#5b331c" />
        </linearGradient>
        <clipPath id="owlBookLogo">
          <rect x="119" y="153" width="24" height="24" rx="5" />
        </clipPath>
      </defs>

      {/* waving wing, behind the body on the left */}
      <g ref={wingRef} style={{ transformBox: 'view-box', transformOrigin: '62px 136px' }}>
        <path d="M62 136 C34 128 22 150 28 176 C40 170 54 160 66 150 Z" fill="#5b331c" />
      </g>

      <g ref={headRef} style={{ transformBox: 'view-box', transformOrigin: '130px 190px' }}>
        {/* ear tufts: drawn first so their base sits inside the head */}
        <g>
          <path d={EAR} fill="#7a4a2a" />
          <path d={EAR_INNER} stroke="#5a3218" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
        <g transform="matrix(-1 0 0 1 260 0)">
          <path d={EAR} fill="#7a4a2a" />
          <path d={EAR_INNER} stroke="#5a3218" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
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
            {/* eyelid: scaled from 0 (open) to 1 (shut) */}
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
        {/* closed-eye curves, shown only while asleep */}
        <g ref={sleepEyesRef} style={{ opacity: 0, transition: 'opacity 500ms' }} stroke="#5a3218" strokeWidth="3" fill="none" strokeLinecap="round">
          {EYES.map((eye) => (
            <path key={eye.cx} d={`M${eye.cx - 14} ${eye.cy + 2} q14 10 28 0`} />
          ))}
        </g>
        {/* beak */}
        <path d="M122 112 L138 112 L130 128 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
      </g>

      {/* wings that come up from behind the books to cover the eyes */}
      {[0, 1].map((i) => (
        <g
          key={i}
          ref={coverRefs[i]}
          style={{
            transformBox: 'view-box',
            transform: 'translateY(118px)',
            transition: 'transform 450ms cubic-bezier(0.3, 1.35, 0.5, 1)',
          }}
        >
          <g transform={i === 1 ? 'matrix(-1 0 0 1 260 0)' : undefined}>
            <path d={COVER_WING} fill="url(#owlWing)" stroke="#4a2914" strokeWidth="1.5" />
            <path d="M80 80 q8 -8 16 -10 M76 94 q10 -8 22 -10 M78 106 q10 -6 22 -8" stroke="#3f2310" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
          </g>
        </g>
      ))}

      {/* sleeping z's */}
      <g ref={zzzRef} style={{ opacity: 0, transition: 'opacity 600ms' }} fill="#fdba74" fontFamily="system-ui, sans-serif" fontWeight="800">
        <text x="196" y="40" fontSize="16" style={{ transformBox: 'fill-box' }}>z</text>
        <text x="208" y="26" fontSize="20" style={{ transformBox: 'fill-box' }}>z</text>
        <text x="222" y="10" fontSize="24" style={{ transformBox: 'fill-box' }}>Z</text>
      </g>

      {/* the row of books it peeks over; the middle one wears the RCF logo */}
      <g>
        <rect x="0" y="150" width="260" height="40" fill="#0d1622" />
        <rect x="6" y="148" width="34" height="42" rx="3" fill="#c2410c" />
        <rect x="11" y="156" width="24" height="3" rx="1.5" fill="#fed7aa" opacity="0.8" />
        <rect x="42" y="142" width="26" height="48" rx="3" fill="#0f766e" />
        <rect x="46" y="150" width="18" height="3" rx="1.5" fill="#99f6e4" opacity="0.7" />
        <rect x="70" y="152" width="42" height="38" rx="3" fill="#1e3a8a" />
        <rect x="76" y="160" width="30" height="3" rx="1.5" fill="#bfdbfe" opacity="0.7" />
        <rect x="114" y="146" width="34" height="44" rx="3" fill="#a16207" />
        <rect x="117.5" y="151.5" width="27" height="27" rx="6" fill="#fde68a" />
        <image href="/logoapp.jpg" x="119" y="153" width="24" height="24" preserveAspectRatio="xMidYMid slice" clipPath="url(#owlBookLogo)" />
        <rect x="119" y="182" width="24" height="2.5" rx="1.25" fill="#fde68a" opacity="0.8" />
        <rect x="150" y="150" width="38" height="40" rx="3" fill="#7c2d12" />
        <rect x="155" y="158" width="28" height="3" rx="1.5" fill="#fdba74" opacity="0.8" />
        <rect x="190" y="144" width="28" height="46" rx="3" fill="#134e4a" />
        <rect x="220" y="153" width="36" height="37" rx="3" fill="#9a3412" />
        <rect x="226" y="161" width="24" height="3" rx="1.5" fill="#fed7aa" opacity="0.7" />
      </g>
    </svg>
  )
}

export default PeekingOwl
