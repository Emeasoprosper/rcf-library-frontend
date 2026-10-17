// RCFMOUAULIBRARYreact/student-dashboard/src/hooks/usePopupMusic.js
import { useCallback, useEffect, useRef, useState } from 'react'

// Plays a track while a popup is on screen and stops it the moment the
// popup goes away. Browsers refuse sound until the person has tapped
// something, so if the first attempt is blocked the track starts on the
// next tap and `blocked` stays true until then.
export default function usePopupMusic(src, { active = true, loop = true, volume = 0.6 } = {}) {
  const audioRef = useRef(null)
  const unlockedAtRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src || !active) return undefined

    const audio = new Audio()
    audio.preload = 'auto'
    audio.loop = loop
    audio.volume = volume
    audio.src = src
    audioRef.current = audio

    let cancelled = false
    let resumeAfterHidden = false
    setFailed(false)
    setBlocked(false)

    function removeUnlock() {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
    function unlock() {
      removeUnlock()
      unlockedAtRef.current = Date.now()
      if (!cancelled) audio.play().catch(() => {})
    }

    const onPlaying = () => { setPlaying(true); setBlocked(false) }
    const onPause = () => setPlaying(false)
    const onError = () => { setFailed(true); setPlaying(false) }
    const onVisibility = () => {
      if (document.hidden) {
        if (!audio.paused) { resumeAfterHidden = true; audio.pause() }
      } else if (resumeAfterHidden) {
        resumeAfterHidden = false
        audio.play().catch(() => {})
      }
    }

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    document.addEventListener('visibilitychange', onVisibility)

    audio.play().catch((err) => {
      if (cancelled) return
      if (err && err.name === 'NotAllowedError') {
        setBlocked(true)
        document.addEventListener('pointerdown', unlock)
        document.addEventListener('keydown', unlock)
      } else if (err && err.name !== 'AbortError') {
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
      removeUnlock()
      document.removeEventListener('visibilitychange', onVisibility)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
      setPlaying(false)
    }
  }, [src, active, loop, volume])

  const toggle = useCallback(() => {
    // The tap that unlocked the sound also lands here as a click; ignore it
    // so it does not instantly pause what it just started.
    if (Date.now() - unlockedAtRef.current < 600) return
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [])

  return { playing, blocked, failed, toggle }
}