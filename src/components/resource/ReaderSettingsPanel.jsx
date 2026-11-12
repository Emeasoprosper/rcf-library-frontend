import { useState, useRef, useEffect } from 'react'

// The floating reader toolbar (zoom, rotate, scroll direction). White with a
// hairline outline; tapping the little pill drips the buttons down one after
// another, and the collapse button folds them back up into the pill.
//
// It can be dragged anywhere. A press only counts as a drag once the finger
// has moved DRAG_THRESHOLD px: before, any 1px finger wobble during a tap on
// a phone counted as a drag, so tapping the collapsed pill often did nothing.
const DRAG_THRESHOLD = 8

function ReaderSettingsPanel({ onZoomIn, onZoomOut, onRotate, readingMode, onToggleReadingMode, containerRef }) {
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState({ x: null, y: null })
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)

  function startDrag(e) {
    if (e.button != null && e.button !== 0) return
    draggingRef.current = true
    movedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    const rect = panelRef.current.getBoundingClientRect()
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return
      if (!movedRef.current) {
        const dx = e.clientX - startRef.current.x
        const dy = e.clientY - startRef.current.y
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        movedRef.current = true
      }
      const bounds = containerRef?.current?.getBoundingClientRect()
      const panelW = panelRef.current?.offsetWidth || 0
      const panelH = panelRef.current?.offsetHeight || 0

      if (bounds) {
        const x = e.clientX - bounds.left - offsetRef.current.x
        const y = e.clientY - bounds.top - offsetRef.current.y
        setPos({ x: Math.min(Math.max(0, x), bounds.width - panelW), y: Math.min(Math.max(0, y), bounds.height - panelH) })
        return
      }
      const x = e.clientX - offsetRef.current.x
      const y = e.clientY - offsetRef.current.y
      setPos({ x: Math.min(Math.max(0, x), window.innerWidth - panelW), y: Math.min(Math.max(0, y), window.innerHeight - panelH) })
    }
    function onUp() { draggingRef.current = false }
    // Pointer events cover mouse, touch and pen alike.
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [containerRef])

  const position = containerRef ? 'absolute' : 'fixed'
  const style = pos.x === null
    ? { right: '12px', top: '33%', position }
    : { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto', position }

  const shell = 'z-30 bg-white text-slate-700 border border-slate-900/10 shadow-[0_6px_24px_rgba(15,23,42,0.18)] touch-none select-none'

  if (collapsed) {
    return (
      <button
        ref={panelRef}
        type="button"
        onPointerDown={startDrag}
        onClick={() => { if (!movedRef.current) setCollapsed(false) }}
        style={style}
        className={`${shell} rcf-pop w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform`}
        aria-label="Show reader settings"
        aria-expanded="false"
      >
        <span className="material-symbols-outlined text-[20px]">tune</span>
      </button>
    )
  }

  const items = [
    { key: 'in', icon: 'zoom_in', label: 'Zoom in', onClick: onZoomIn },
    { key: 'out', icon: 'zoom_out', label: 'Zoom out', onClick: onZoomOut },
    onRotate && { key: 'rotate', icon: 'rotate_right', label: 'Rotate page', onClick: onRotate },
    onToggleReadingMode && {
      key: 'mode',
      icon: readingMode === 'vertical' ? 'swap_horiz' : 'swap_vert',
      label: readingMode === 'vertical' ? 'Switch to left/right scroll' : 'Switch to up/down scroll',
      onClick: onToggleReadingMode,
    },
    { key: 'close', icon: 'keyboard_arrow_up', label: 'Collapse settings', onClick: () => setCollapsed(true) },
  ].filter(Boolean)

  return (
    <div ref={panelRef} style={style} className={`${shell} rcf-drip-open w-11 rounded-full flex flex-col items-center py-1`}>
      <div
        onPointerDown={startDrag}
        className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400"
        aria-hidden="true"
      >
        <span className="block w-4 h-[3px] rounded-full bg-slate-300" />
      </div>

      {items.map((item, i) => (
        <div key={item.key} className="rcf-drip-item w-full flex flex-col items-center" style={{ animationDelay: `${60 + i * 55}ms` }}>
          {i > 0 && <span className="block w-5 h-px bg-slate-900/10" />}
          <button
            type="button"
            onClick={item.onClick}
            className={`w-9 h-9 my-0.5 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 active:bg-slate-200 ${item.key === 'close' ? 'text-slate-400' : ''}`}
            aria-label={item.label}
            title={item.label}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          </button>
        </div>
      ))}
    </div>
  )
}

export default ReaderSettingsPanel
