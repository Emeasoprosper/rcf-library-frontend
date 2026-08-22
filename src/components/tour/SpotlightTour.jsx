// RCFMOUAULIBRARYreact/student-dashboard/src/components/tour/SpotlightTour.jsx
import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import { useTour } from '../../contexts/TourContext'

const PADDING = 10 // gap between spotlight hole and the actual element
const TOOLTIP_MARGIN = 16
const TOOLTIP_MIN_GAP = TOOLTIP_MARGIN + 12 // enforced clearance between tooltip and target
const TOOLTIP_WIDTH = 300
const VIEWPORT_TOLERANCE = 4 // px slack before we consider an element "already visible"
const SETTLE_MAX_MS = 700 // hard cap on how long we'll poll for the target to stop moving
const SETTLE_STABLE_FRAMES = 3 // consecutive matching frames required before we call it "settled"

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(max, min))
}

function isFullyVisible(rect) {
  return (
    rect.top >= VIEWPORT_TOLERANCE &&
    rect.left >= VIEWPORT_TOLERANCE &&
    rect.bottom <= window.innerHeight - VIEWPORT_TOLERANCE &&
    rect.right <= window.innerWidth - VIEWPORT_TOLERANCE
  )
}

function rectsMatch(a, b) {
  if (!a || !b) return a === b
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  )
}

// Four plain (unmasked) rectangles framing the target. Each one just
// backdrop-blurs + dims its own patch of screen — the gap between them is
// real empty space, so whatever sits under it (icons, labels, anything)
// shows through with zero manipulation. This avoids combining
// backdrop-filter with mask-image, which reliably renders as a solid black
// hole on several mobile browsers when the masked element sits above
// another element that also uses backdrop-filter (e.g. the bottom nav).
function computeFrameRects(rect) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (!rect) {
    return [{ top: 0, left: 0, width: vw, height: vh }]
  }

  const holeLeft = Math.max(rect.left - PADDING, 0)
  const holeTop = Math.max(rect.top - PADDING, 0)
  const holeRight = Math.min(rect.left + rect.width + PADDING, vw)
  const holeBottom = Math.min(rect.top + rect.height + PADDING, vh)

  return [
    { top: 0, left: 0, width: vw, height: holeTop }, // above the hole
    { top: holeBottom, left: 0, width: vw, height: Math.max(vh - holeBottom, 0) }, // below the hole
    { top: holeTop, left: 0, width: holeLeft, height: holeBottom - holeTop }, // left of the hole
    { top: holeTop, left: holeRight, width: Math.max(vw - holeRight, 0), height: holeBottom - holeTop }, // right of the hole
  ]
}

// Computes tooltip position using the tooltip's REAL measured height. If
// neither above nor below the target has enough clearance, falls back to a
// fixed safe zone instead of risking an overlap with the target.
function computeTooltipPos(rect, tooltipHeight) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const height = tooltipHeight || 200

  if (!rect) {
    return { top: vh / 2 - height / 2, left: vw / 2 - TOOLTIP_WIDTH / 2 }
  }

  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  left = clamp(left, TOOLTIP_MARGIN, vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN)

  const spaceBelow = vh - rect.bottom - PADDING
  const spaceAbove = rect.top - PADDING

  let top
  if (spaceBelow >= height + TOOLTIP_MIN_GAP) {
    top = rect.bottom + PADDING + 12
  } else if (spaceAbove >= height + TOOLTIP_MIN_GAP) {
    top = rect.top - PADDING - 12 - height
  } else if (spaceBelow >= spaceAbove) {
    // Neither side has full room (e.g. a bottom-nav item on a short
    // viewport, or a tall target eating most of the screen) — use
    // whichever side actually has MORE room rather than a fixed offset,
    // so we never land the tooltip back inside the spotlight band itself.
    top = rect.bottom + PADDING + 12
  } else {
    top = rect.top - PADDING - 12 - height
  }

  // Clamp against the viewport only — never let the clamp pull the
  // tooltip back toward the target when the card is taller than the
  // available space (that would reintroduce the overlap this branch
  // exists to avoid).
  top = clamp(top, TOOLTIP_MARGIN, Math.max(vh - height - TOOLTIP_MARGIN, TOOLTIP_MARGIN))
  return { top, left }
}

function SpotlightTour() {
  const { active, stepIndex, steps, nextStep, prevStep, skipTour } = useTour()
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(null)
  const rafRef = useRef(null)
  const settleRafRef = useRef(null)
  const scrollTimerRef = useRef(null)
  const tooltipRef = useRef(null)
  const resizeObserverRef = useRef(null)

  const step = steps[stepIndex]

  // Single, synchronous read of the target's current rect. Returns null
  // when there's no selector for this step (centered/modal-style step) or
  // the element isn't in the DOM.
  const measureOnce = useCallback(() => {
    if (!step) return null
    if (!step.selector) return null
    const el = document.querySelector(step.selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }, [step])

  // Keeps re-measuring on every animation frame until the target's rect
  // stops changing for a few consecutive frames (or a hard time cap is
  // hit). This is what fixes the tooltip landing on top of a target that
  // hasn't finished moving: a single fixed-delay measurement after
  // scrollIntoView can fire before a sticky header / hero section /
  // search bar finishes settling into its final position, so the ring and
  // tooltip both get placed relative to a rect that's about to shift out
  // from under them.
  const settleAndMeasure = useCallback(() => {
    cancelAnimationFrame(settleRafRef.current)
    setReady(false)
    setTooltipHeight(null)

    const startTime = performance.now()
    let lastRect = null
    let stableCount = 0

    const tick = () => {
      const current = measureOnce()

      if (rectsMatch(current, lastRect)) {
        stableCount += 1
      } else {
        stableCount = 0
      }
      lastRect = current

      const timedOut = performance.now() - startTime > SETTLE_MAX_MS
      const settled = stableCount >= SETTLE_STABLE_FRAMES

      if (settled || timedOut) {
        setRect(current)
        setReady(true)
        return
      }

      settleRafRef.current = requestAnimationFrame(tick)
    }

    settleRafRef.current = requestAnimationFrame(tick)
  }, [measureOnce])

  // Decide whether we need to scroll at all, then settle-measure.
  useLayoutEffect(() => {
    if (!active || !step) return
    clearTimeout(scrollTimerRef.current)
    cancelAnimationFrame(settleRafRef.current)

    const el = step.selector ? document.querySelector(step.selector) : null

    if (el) {
      const currentRect = el.getBoundingClientRect()
      if (isFullyVisible(currentRect)) {
        settleAndMeasure()
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Give the smooth scroll a moment to start, then poll frame-by-frame
        // until the rect actually stops moving instead of trusting a single
        // fixed delay.
        scrollTimerRef.current = setTimeout(settleAndMeasure, 150)
      }
    } else {
      settleAndMeasure()
    }

    return () => {
      clearTimeout(scrollTimerRef.current)
      cancelAnimationFrame(settleRafRef.current)
    }
  }, [active, step, settleAndMeasure])

  // Watch the target element itself for size changes — e.g. a search bar
  // that grows when focused/suggestions appear, or content above it
  // loading in and pushing it down. Window resize/scroll listeners alone
  // don't catch this class of shift since it's neither.
  useLayoutEffect(() => {
    if (!active || !step || !step.selector) return
    const el = document.querySelector(step.selector)
    if (!el || typeof ResizeObserver === 'undefined') return

    resizeObserverRef.current = new ResizeObserver(() => {
      settleAndMeasure()
    })
    resizeObserverRef.current.observe(el)

    return () => {
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
    }
  }, [active, step, settleAndMeasure])

  // Re-measure the actual tooltip card size once it's rendered.
  useLayoutEffect(() => {
    if (!ready || !tooltipRef.current) return
    const h = tooltipRef.current.getBoundingClientRect().height
    if (h && Math.abs(h - (tooltipHeight || 0)) > 1) {
      setTooltipHeight(h)
    }
  })

  useLayoutEffect(() => {
    if (!active) return
    const onChange = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setRect(measureOnce()))
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [active, measureOnce])

  if (!active || !step) return null

  const frameRects = computeFrameRects(rect)
  const tooltipPos = computeTooltipPos(rect, tooltipHeight)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1
  const fullyPositioned = ready && tooltipHeight !== null

  return (
    <div
      className="fixed inset-0 z-[1000]"
      style={{ opacity: fullyPositioned ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <style>{`
        @keyframes tourPulseRing {
          0% { box-shadow: 0 0 0 0 rgba(249,115,22,0.55); }
          70% { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        .tour-ring { animation: tourPulseRing 1.6s ease-out infinite; }
        @keyframes tourFadeUp {
          0% { opacity: 0; transform: translateY(8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tour-card { animation: tourFadeUp 320ms cubic-bezier(0.25,1,0.5,1); }
      `}</style>

      {/* Four unmasked rectangles framing the target — dims/blurs everything
          except the real gap left open around the target itself. Position
          is intentionally NOT CSS-transitioned: while the page is still
          settling from a scrollIntoView, the live scroll/resize listener
          re-measures every frame, and animating on top of that would make
          the spotlight visibly lag behind a target that's still moving. */}
      {frameRects.map((r, i) => (
        <div
          key={i}
          className="absolute backdrop-blur-sm bg-black/70 pointer-events-auto"
          style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
          onClick={(e) => e.stopPropagation()}
        />
      ))}

      {/* Attention ring around the target */}
      {rect && (
        <div
          className="tour-ring absolute rounded-2xl border-2 border-orange-500 pointer-events-none"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="tour-card absolute bg-surface-container-highest border border-outline rounded-2xl shadow-2xl p-5"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
        }}
      >
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">{step.title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">{step.body}</p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? 'bg-orange-500' : 'bg-outline'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={skipTour}
              className="px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Skip
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotlightTour