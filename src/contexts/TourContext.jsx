// RCFMOUAULIBRARYreact/student-dashboard/src/contexts/TourContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { TOUR_STEPS } from '../lib/tourSteps'

const TOUR_STORAGE_KEY = 'rcf_tour_completed_v1'
export const TOUR_FORCE_START_KEY = 'rcf_tour_force_start'

const TourContext = createContext(null)

export function TourProvider({ children }) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const hasCompletedTour = useCallback(() => {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
    } catch {
      // If storage is unavailable, don't force the tour on every load.
      return true
    }
  }, [])

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    } catch {
      // Worst case the tour reappears next visit — not worth failing over.
    }
  }, [])

  const startTour = useCallback(() => {
    setStepIndex(0)
    setActive(true)
  }, [])

  const nextStep = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        setActive(false)
        markCompleted()
        return i
      }
      return i + 1
    })
  }, [markCompleted])

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const skipTour = useCallback(() => {
    setActive(false)
    markCompleted()
  }, [markCompleted])

  const finishTour = useCallback(() => {
    setActive(false)
    markCompleted()
  }, [markCompleted])

  const shouldForceStart = useCallback(() => {
    try {
      if (sessionStorage.getItem(TOUR_FORCE_START_KEY) === '1') {
        sessionStorage.removeItem(TOUR_FORCE_START_KEY)
        return true
      }
    } catch {
      // ignore
    }
    return false
  }, [])

  const value = {
    active,
    stepIndex,
    steps: TOUR_STEPS,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    hasCompletedTour,
    shouldForceStart,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}