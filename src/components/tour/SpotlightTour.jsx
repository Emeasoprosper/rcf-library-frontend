// RCFMOUAULIBRARYreact/student-dashboard/src/components/tour/SpotlightTour.jsx
import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import { useTour } from '../../contexts/TourContext'
import { useIsDesktopViewport } from '../../hooks/useIsDesktopViewport'

const PADDING = 10
const TOOLTIP_MARGIN = 16
const TOOLTIP_MIN_GAP = TOOLTIP_MARGIN + 12
const TOOLTIP_WIDTH = 300
const VIEWPORT_TOLERANCE = 4
const SETTLE_MAX_MS = 700
const SETTLE_STABLE_FRAMES = 3

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

// Picks the right selector for the current viewport. A step with no
// desktopSelector (none defined) falls back to its mobileSelector, so
// existing steps keep working even before every step has a desktop
// variant.
function getSelector(step, isDesktop) {
  if (!step) return null
  if (isDesktop && step.desktopSelector) return step.desktopSelector
  return step.mobileSelector
}

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
    { top: 0, left: 0, width: vw, height: holeTop },
    { top: holeBottom, left: 0, width: vw, height: Math.max(vh - holeBottom, 0) },
    { top: holeTop, left: 0, width: holeLeft, height: holeBottom - holeTop },
    { top: holeTop, left: holeRight, width: Math.max(vw - holeRight, 0), height: holeBottom - holeTop },
  ]
}

function computeTooltipPos(rect, tooltipHeight) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const height = tooltipHeight || 200

  if (!rect) {
    return { top: Math.max((vh - height) / 2, TOOLTIP_MARGIN), left: (vw - TOOLTIP_WIDTH) / 2 }
  }

  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  left = clamp(left, TOOLTIP_MARGIN, vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN)

  const belowTop = rect.bottom + PADDING + 12
  const aboveTop = rect.top - PADDING - 12 - height

  const belowFits = belowTop + height <= vh - TOOLTIP_MARGIN
  const aboveFits = aboveTop >= TOOLTIP_MARGIN

  let top
  if (belowFits) {
    top = belowTop
  } else if (aboveFits) {
    top = aboveTop
  } else {
    const spaceBelow = vh - belowTop
    const spaceAbove = rect.top - PADDING - 12
    if (spaceBelow >= spaceAbove) {
      top = Math.max(belowTop, TOOLTIP_MARGIN)
    } else {
      top = Math.max(aboveTop, TOOLTIP_MARGIN)
      if (top + height > rect.top - PADDING) {
        top = Math.max(belowTop, TOOLTIP_MARGIN)
      }
    }
  }

  return { top, left }
}

function SpotlightTour() {
  const { active, stepIndex, steps, nextStep, prevStep, skipTour } = useTour()
  const isDesktop = useIsDesktopViewport()
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(null)
  const rafRef = useRef(null)
  const settleRafRef = useRef(null)
  const scrollTimerRef = useRef(null)
  const tooltipRef = useRef(null)
  const resizeObserverRef = useRef(null)

  const step = steps[stepIndex]
  const selector = getSelector(step, isDesktop)

  const measureOnce = useCallback(() => {
    if (!selector) return null
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }, [selector])

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

  useLayoutEffect(() => {
    if (!active || !step) return
    clearTimeout(scrollTimerRef.current)
    cancelAnimationFrame(settleRafRef.current)

    const el = selector ? document.querySelector(selector) : null

    if (el) {
      const currentRect = el.getBoundingClientRect()
      if (isFullyVisible(currentRect)) {
        settleAndMeasure()
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        scrollTimerRef.current = setTimeout(settleAndMeasure, 150)
      }
    } else {
      settleAndMeasure()
    }

    return () => {
      clearTimeout(scrollTimerRef.current)
      cancelAnimationFrame(settleRafRef.current)
    }
  }, [active, step, selector, settleAndMeasure])

  useLayoutEffect(() => {
    if (!active || !step || !selector) return
    const el = document.querySelector(selector)
    if (!el || typeof ResizeObserver === 'undefined') return

    resizeObserverRef.current = new ResizeObserver(() => {
      settleAndMeasure()
    })
    resizeObserverRef.current.observe(el)

    return () => {
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
    }
  }, [active, step, selector, settleAndMeasure])

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

      {frameRects.map((r, i) => (
        <div
          key={i}
          className="absolute backdrop-blur-sm bg-black/70 pointer-events-auto"
          style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
          onClick={(e) => e.stopPropagation()}
        />
      ))}

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