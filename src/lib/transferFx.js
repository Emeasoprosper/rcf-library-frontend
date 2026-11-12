// RCFMOUAULIBRARYreact/student-dashboard/src/lib/transferFx.js
// One place that knows about every data transfer in flight: offline
// downloads, resource uploads, and requests that send something (messages,
// saves, posts). <TransferFx /> (mounted once in App) draws from it:
//   - downloads get a floating progress ring with the percentage,
//   - anything running longer than SLOW_MS gets a "taking longer than
//     expected, please don't leave" popup,
//   - leaving the page mid-download/upload asks the browser to confirm.
//
// Usage:
//   const t = beginTransfer({ kind: 'download', title })
//   t.progress(42)      // 0-100, or null when the size is unknown
//   t.end()

import { noteFirstUse } from './feedbackMoments'

export const TRANSFER_EVENT = 'rcf:transfers'
export const BOOKMARK_EVENT = 'rcf:bookmark-saved'

// "Saved for later" toast with a bookmark dropping into place.
export function playBookmarkSaved(title = '') {
  window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT, { detail: { title, saved: true } }))
  noteFirstUse('save')
}

// Tapping Save again unsaves: "Removed from saved", bookmark lifting away.
export function playBookmarkRemoved(title = '') {
  window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT, { detail: { title, saved: false } }))
}
export const SLOW_MS = 15000

const active = new Map()
let nextId = 1

function emit() {
  window.dispatchEvent(new CustomEvent(TRANSFER_EVENT, { detail: listTransfers() }))
}

export function listTransfers() {
  return [...active.values()].map((t) => ({ ...t }))
}

// kind: 'download' | 'upload' | 'request'
export function beginTransfer({ kind = 'request', title = '' } = {}) {
  const id = nextId++
  active.set(id, { id, kind, title, progress: null, startedAt: Date.now() })
  emit()
  let ended = false
  return {
    progress(pct) {
      const t = active.get(id)
      if (!t) return
      const next = pct == null ? null : Math.max(0, Math.min(100, Math.round(pct)))
      if (t.progress === next) return
      t.progress = next
      emit()
    },
    end() {
      if (ended) return
      ended = true
      active.delete(id)
      emit()
    },
  }
}

// Wraps a promise-returning task so it's tracked for its whole life.
export async function trackTransfer(opts, task) {
  const t = beginTransfer(opts)
  try {
    return await task(t)
  } finally {
    t.end()
  }
}
