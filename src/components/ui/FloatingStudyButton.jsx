import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const HIDDEN_PREFIXES = ['/reading-space', '/signin', '/splash', '/complete-profile', '/admin']
const STORAGE_KEY = 'rcf_study_btn_pos'
const SIZE = 56
const EDGE = 16
const TOP_CLEARANCE = 80
const NAV_CLEARANCE = 96

function clampY(y) {
  const max = window.innerHeight - SIZE - NAV_CLEARANCE
  return Math.min(Math.max(y, TOP_CLEARANCE), Math.max(max, TOP_CLEARANCE))
}

function loadPos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && (saved.side === 'left' || saved.side === 'right') && Number.isFinite(saved.y)) return saved
  } catch {
    // ignore bad storage
  }
  return { side: 'right', y: window.innerHeight - SIZE - NAV_CLEARANCE - 8 }
}

function FloatingStudyButton() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [pos, setPos] = useState(loadPos)
  const [drag, setDrag] = useState(null)
  const gesture = useRef(null)

  const onPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const g = gesture.current
    if (!g) return
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < 6) return
    g.moved = true
    setDrag({
      x: Math.min(Math.max(e.clientX - g.offX, 0), window.innerWidth - SIZE),
      y: Math.min(Math.max(e.clientY - g.offY, 0), window.innerHeight - SIZE),
    })
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (!g.moved) {
      navigate('/reading-space')
      return
    }
    const centerX = e.clientX - g.offX + SIZE / 2
    const next = { side: centerX < window.innerWidth / 2 ? 'left' : 'right', y: clampY(e.clientY - g.offY) }
    setPos(next)
    setDrag(null)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  const onPointerCancel = () => {
    gesture.current = null
    setDrag(null)
  }

  if (!isAuthenticated) return null
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  if (/^\/resources\/[^/]+\/read/.test(pathname)) return null

  const style = drag
    ? { left: drag.x, top: drag.y }
    : pos.side === 'left'
      ? { left: EDGE, top: clampY(pos.y) }
      : { right: EDGE, top: clampY(pos.y) }

  return (
    <button
      aria-label="Open Reading Space"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="fixed z-40 md:hidden w-14 h-14 rounded-full flex items-center justify-center touch-none select-none"
    >
      <style>{`
        @keyframes studyWave { 0% { transform: scale(1); opacity: 0.5; } 5% { transform: scale(1.8); opacity: 0; } 5.01% { transform: scale(1); opacity: 0.5; } 10% { transform: scale(1.8); opacity: 0; } 10.01%, 100% { transform: scale(1); opacity: 0; } }
        @keyframes studyWiggle { 0% { transform: rotate(0); } 1% { transform: rotate(-14deg); } 2% { transform: rotate(12deg); } 3% { transform: rotate(-8deg); } 4% { transform: rotate(6deg); } 5%, 100% { transform: rotate(0); } }
        .study-wave { animation: studyWave 33s ease-out infinite; opacity: 0; }
        .study-wiggle { animation: studyWiggle 33s ease-in-out infinite; }
      `}</style>
      <span className="study-wave pointer-events-none absolute inset-0 rounded-full bg-orange-500 motion-reduce:hidden" />
      <span className="pointer-events-none relative w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 border border-white/20">
        <span className="study-wiggle material-symbols-outlined text-[28px]">auto_stories</span>
      </span>
    </button>
  )
}

export default FloatingStudyButton