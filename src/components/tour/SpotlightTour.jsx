// RCFMOUAULIBRARYreact/student-dashboard/src/components/tour/SpotlightTour.jsx
import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import { useTour } from '../../contexts/TourContext'

const PADDING = 10 // gap between spotlight ring and the actual element
const RADIUS = 16
const TOOLTIP_MARGIN = 16
const TOOLTIP_WIDTH = 300

function buildMask(rect) {
  if (!rect) return null
  const vw = window.innerWidth
  const vh = window.innerHeight
  const x = Math.max(rect.left - PADDING, 0)
  const y = Math.max(rect.top - PADDING, 0)
  const w = rect.width + PADDING * 2
  const h = rect.height + PADDING * 2
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${vw}' height='${vh}'>` +
    `<rect width='100%' height='100%' fill='white'/>` +
    `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${RADIUS}' fill='black'/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function computeTooltipPos(rect) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (!rect) {
    return { top: vh / 2, left: vw / 2, transform: 'translate(-50%, -50%)' }
  }

  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  const placeBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove

  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  left = Math.min(Math.max(left, TOOLTIP_MARGIN), vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN)

  if (placeBelow) {
    return { top: rect.bottom + PADDING + 12, left, transform: 'none' }
  }
  return { top: rect.top - PADDING - 12, left, transform: 'translateY(-100%)' }
}

function SpotlightTour() {
  const { active, stepIndex, steps, nextStep, prevStep, skipTour } = useTour()
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const rafRef = useRef(null)
  const scrollTimerRef = useRef(null)

  const step = steps[stepIndex]

  const measure = useCallback(() => {
    if (!step) return
    if (!step.selector) {
      setRect(null)
      setReady(true)
      return
    }
    const el = document.querySelector(step.selector)
    if (!el) {
      setRect(null)
      setReady(true)
      return
    }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    setReady(true)
  }, [step])

  useLayoutEffect(() => {
    if (!active || !step) return
    setReady(false)

    let el = null
    if (step.selector) el = document.querySelector(step.selector)

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      scrollTimerRef.current = setTimeout(measure, 380)
    } else {
      measure()
    }

    return () => clearTimeout(scrollTimerRef.current)
  }, [active, step, measure])

  useLayoutEffect(() => {
    if (!active) return
    const onChange = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [active, measure])

  if (!active || !step) return null

  const mask = buildMask(rect)
  const tooltipPos = computeTooltipPos(rect)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  return (
    <div className="fixed inset-0 z-[1000]" style={{ opacity: ready ? 1 : 0, transition: 'opacity 200ms ease' }}>
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

      {/* Dim + blur everything except the spotlight cutout */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/70 transition-all duration-500 ease-out"
        style={
          mask
            ? { WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      />

      {/* Attention ring around the target */}
      {rect && (
        <div
          className="tour-ring absolute rounded-2xl border-2 border-orange-500 pointer-events-none transition-all duration-500 ease-out"
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
        className="tour-card absolute bg-surface-container-highest border border-outline rounded-2xl shadow-2xl p-5 transition-all duration-500 ease-out"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
          transform: tooltipPos.transform,
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