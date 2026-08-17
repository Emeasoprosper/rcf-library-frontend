import { useState, useEffect, useRef } from 'react'

export function useScrollDirection() {
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const current = window.pageYOffset
      if (current <= 0) {
        setHidden(false)
        lastScroll.current = current
        return
      }
      if (current > lastScroll.current && current - lastScroll.current > 5) {
        setHidden(true)
      } else if (current < lastScroll.current) {
        setHidden(false)
      }
      lastScroll.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return hidden
}
