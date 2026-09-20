import { useState, useEffect, useRef } from 'react'

export function useScrollDirection() {
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)
  const threshold = 3

  useEffect(() => {
    const handleScroll = () => {
      const current = window.pageYOffset || document.documentElement.scrollTop || 0
      const delta = current - lastScroll.current

      if (current <= 0) {
        setHidden(false)
        lastScroll.current = current
        return
      }

      if (Math.abs(delta) < threshold) {
        return
      }

      if (delta > 0) {
        setHidden(true)
      } else {
        setHidden(false)
      }

      lastScroll.current = current
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return hidden
}
