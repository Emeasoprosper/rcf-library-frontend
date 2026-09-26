import { useEffect, useMemo, useState } from 'react'

function seedToHue(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
}

function buildFadeGradient(seed) {
  const hue = seedToHue(seed)
  const stops = [0, 0.12, 0.26, 0.42, 0.58, 0.74, 0.88, 1]

  const css = stops
    .map((pos) => {
      const t = easeInOutQuad(pos)
      const lightness = 46 * (1 - t) + 4 * t
      const saturation = 62 * (1 - t) + 20 * t
      return `hsl(${hue} ${saturation}% ${lightness}%) ${Math.round(pos * 100)}%`
    })
    .join(', ')

  return { css: `linear-gradient(to bottom, ${css})`, hue }
}

// Multi-category field. Stores a plain comma-separated string of names
// (not ids) — the backend's categoryNames field finds-or-creates each
// name server-side, so the frontend never needs to know ids for this.
// Three ways to add a category, usable together in the same session:
//  1. Click an existing category chip below the input to add it.
//  2. Type a name and press Enter.
//  3. Type several at once separated by commas — each segment before a
//     comma is committed immediately as you type it.
function CategoryMultiPill({ label, value, categories, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [typedInput, setTypedInput] = useState('')

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  const selectedNames = draft.split(',').map((s) => s.trim()).filter(Boolean)

  const addName = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (selectedNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return
    setDraft([...selectedNames, trimmed].join(', '))
  }

  const removeName = (name) => {
    setDraft(selectedNames.filter((n) => n.toLowerCase() !== name.toLowerCase()).join(', '))
  }

  const handleTypedInputChange = (e) => {
    const val = e.target.value
    if (val.includes(',')) {
      const parts = val.split(',')
      const trailing = parts.pop()
      parts.map((p) => p.trim()).filter(Boolean).forEach(addName)
      setTypedInput(trailing)
    } else {
      setTypedInput(val)
    }
  }

  const handleTypedInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      addName(typedInput)
      setTypedInput('')
    }
  }

  const confirm = () => {
    let finalNames = selectedNames
    if (typedInput.trim()) {
      finalNames = [...selectedNames, typedInput.trim()]
    }
    onSave(finalNames.join(', '))
    setEditing(false)
    setTypedInput('')
  }

  const undo = () => {
    setDraft(value || '')
    setTypedInput('')
    setEditing(false)
  }

  const availableCategories = categories.filter(
    (c) => !selectedNames.some((n) => n.toLowerCase() === c.name.toLowerCase())
  )

  return (
    <div className="rounded-2xl bg-surface-container-high border border-outline px-4 py-2.5">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>

      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left flex items-start justify-between gap-2 mt-0.5 group"
        >
          <span className="font-body-md text-body-md text-on-surface truncate">
            {selectedNames.length ? selectedNames.join(', ') : '—'}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px] flex-none opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            edit
          </span>
        </button>
      ) : (
        <div className="mt-1 flex flex-col gap-2">
          {selectedNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedNames.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-primary/15 text-primary text-[12px] font-semibold"
                >
                  {name}
                  <button
                    onClick={() => removeName(name)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/25"
                    aria-label={`Remove ${name}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addName(c.name)}
                  className="px-2.5 py-1 rounded-full bg-surface-container-low border border-outline text-on-surface-variant text-[12px]"
                >
                  + {c.name}
                </button>
              ))}
            </div>
          )}

          <input
            autoFocus
            value={typedInput}
            onChange={handleTypedInputChange}
            onKeyDown={handleTypedInputKeyDown}
            placeholder="Type a category, use commas for more..."
            className="w-full bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={undo}
              aria-label="Undo"
              className="flex-none w-8 h-8 rounded-full bg-surface-container-low border border-outline flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">undo</span>
            </button>
            <button
              onClick={confirm}
              aria-label="Confirm"
              className="flex-none w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">check</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EditablePill({ label, value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const startEditing = () => {
    setDraft(value)
    setEditing(true)
  }

  const confirm = () => {
    onSave(draft)
    setEditing(false)
  }

  const undo = () => {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl bg-surface-container-high border border-outline px-4 py-2.5">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>

      {!editing ? (
        <button onClick={startEditing} className="w-full text-left flex items-start justify-between gap-2 mt-0.5 group">
          <span className={`font-body-md text-body-md text-on-surface ${type === 'textarea' ? 'line-clamp-2' : 'truncate'}`}>
            {value || '—'}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px] flex-none opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            edit
          </span>
        </button>
      ) : (
        <div className={`flex gap-2 mt-1 ${type === 'textarea' ? 'items-end' : 'items-center'}`}>
          {type === 'textarea' && (
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-grow min-w-0 bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary resize-none"
            />
          )}

          {type === 'text' && (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              className="flex-grow min-w-0 bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary"
            />
          )}

          <button
            onClick={undo}
            aria-label="Undo"
            className="flex-none w-8 h-8 rounded-full bg-surface-container-low border border-outline flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">undo</span>
          </button>
          <button
            onClick={confirm}
            aria-label="Confirm"
            className="flex-none w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">check</span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * fields: [{ key, label, value, type: 'text' | 'textarea' | 'categories', categories? }]
 * onFieldSave(key, newValue) fires the moment a single field is confirmed —
 * each pill saves independently, nothing waits for a final "Save" button.
 */
function PreviewEditModal({ open, onClose, seed, previewUrl, fallbackIcon = 'description', fallbackNode = null, fields, onFieldSave }) {
  const gradient = useMemo(() => buildFadeGradient(seed || 'default'), [seed])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-margin-mobile"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] overflow-hidden bg-surface-container border border-outline shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex-none flex items-center justify-center px-stack-lg pt-stack-lg pb-stack-xl"
          style={{ background: gradient.css }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-[18px]">close</span>
          </button>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="max-h-56 w-auto rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-white/10"
            />
          ) : (
            <div className="w-32 h-40 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center">
              {fallbackNode || <span className="material-symbols-outlined text-white/80 text-4xl">{fallbackIcon}</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-stack-sm p-stack-md overflow-y-auto">
          {fields.map((field) =>
            field.type === 'categories' ? (
              <CategoryMultiPill
                key={field.key}
                label={field.label}
                value={field.value}
                categories={field.categories}
                onSave={(newValue) => onFieldSave(field.key, newValue)}
              />
            ) : (
              <EditablePill
                key={field.key}
                label={field.label}
                value={field.value}
                type={field.type}
                onSave={(newValue) => onFieldSave(field.key, newValue)}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default PreviewEditModal