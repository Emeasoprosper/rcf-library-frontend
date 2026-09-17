import { useState, useRef, useEffect } from 'react'

function ReaderSettingsPanel({ onZoomIn, onZoomOut, onRotate, readingMode, onToggleReadingMode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState({ x: null, y: null })
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)

  function startDrag(e) {
    draggingRef.current = true
    movedRef.current = false
    const point = e.touches ? e.touches[0] : e
    const rect = panelRef.current.getBoundingClientRect()
    offsetRef.current = { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return
      movedRef.current = true
      const point = e.touches ? e.touches[0] : e
      const x = point.clientX - offsetRef.current.x
      const y = point.clientY - offsetRef.current.y
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0)
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0)
      setPos({ x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) })
    }
    function onUp() { draggingRef.current = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  const style = pos.x === null
    ? { right: '12px', top: '33%' }
    : { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto' }

  if (collapsed) {
    return (
      <button
        ref={panelRef}
        onPointerDown={startDrag}
        onTouchStart={startDrag}
        onClick={() => { if (!movedRef.current) setCollapsed(false) }}
        style={style}
        className="fixed z-30 w-11 h-11 rounded-full bg-surface-container border border-outline shadow-lg flex items-center justify-center touch-none"
        aria-label="Show reader settings"
      >
        <span className="material-symbols-outlined text-on-surface text-[20px]">tune</span>
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      style={style}
      className="fixed z-30 flex flex-col bg-surface-container border border-outline rounded-xl overflow-hidden shadow-lg touch-none"
    >
      <div
        onPointerDown={startDrag}
        onTouchStart={startDrag}
        className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-surface-container-high"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[16px]">drag_indicator</span>
      </div>

      <button onClick={onZoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Zoom in">
        <span className="material-symbols-outlined text-on-surface text-[20px]">zoom_in</span>
      </button>
      <div className="h-px bg-outline" />
      <button onClick={onZoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Zoom out">
        <span className="material-symbols-outlined text-on-surface text-[20px]">zoom_out</span>
      </button>

      {onRotate && (
        <>
          <div className="h-px bg-outline" />
          <button onClick={onRotate} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Rotate page">
            <span className="material-symbols-outlined text-on-surface text-[20px]">rotate_right</span>
          </button>
        </>
      )}

      {onToggleReadingMode && (
        <>
          <div className="h-px bg-outline" />
          <button
            onClick={onToggleReadingMode}
            className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high"
            aria-label={readingMode === 'vertical' ? 'Switch to left/right scroll' : 'Switch to up/down scroll'}
          >
            <span className="material-symbols-outlined text-on-surface text-[20px]">
              {readingMode === 'vertical' ? 'swap_horiz' : 'swap_vert'}
            </span>
          </button>
        </>
      )}

      <div className="h-px bg-outline" />
      <button onClick={() => setCollapsed(true)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Collapse settings">
        <span className="material-symbols-outlined text-on-surface text-[20px]">close_fullscreen</span>
      </button>
    </div>
  )
}

export default ReaderSettingsPanel