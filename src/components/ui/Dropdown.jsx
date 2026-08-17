// components/ui/Dropdown.jsx
import { useState, useRef, useEffect } from 'react'

// Drop-in replacement for a native <select> that actually matches the
// app's dark theme — native selects can't be styled past a certain point
// (the open dropdown itself is rendered by the OS/browser, not the page),
// which is why Category/Department looked like a plain system control.
//
// options: array of { id, name }
// value: currently selected id (string or number) or ''
// onChange: (id: string) => void — called with '' when "clear" is picked
function Dropdown({ value, onChange, options, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find((o) => String(o.id) === String(value))

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded-lg text-left flex items-center justify-between font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
      >
        <span className={`truncate ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[20px] text-on-surface-variant flex-none transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto bg-surface-container-high border border-outline rounded-lg shadow-xl py-1">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-highest font-body-md text-body-md transition-colors"
          >
            {placeholder}
          </button>
          {options.map((o) => {
            const isSelected = String(o.id) === String(value)
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(String(o.id))
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 font-body-md text-body-md truncate transition-colors ${
                  isSelected
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {o.name}
              </button>
            )
          })}
          {options.length === 0 && (
            <p className="px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant/60">
              No options available
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown