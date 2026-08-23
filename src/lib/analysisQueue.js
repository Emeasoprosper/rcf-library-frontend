// lib/analysisQueue.js
//
// Caps how many AI analysis requests (analyzeResource, see
// services/api.js) run at once across every FilePreviewCard on the
// page. Without this, selecting several files at once fires one Gemini
// request per file simultaneously — easy to blow through the free
// tier's per-minute request limit in a single burst, causing every
// request after the first couple to silently fall back to
// filename-only suggestions for no real reason.
//
// Module-level state on purpose, not component state — the limit needs
// to apply across ALL FilePreviewCard instances rendered on the page
// at once, not reset per-card. A plain FIFO queue: extra files just
// wait their turn instead of failing.

const MAX_CONCURRENT = 2

let active = 0
const waiting = []

function runNext() {
  if (active >= MAX_CONCURRENT) return
  const next = waiting.shift()
  if (!next) return

  active += 1
  next
    .task()
    .then(next.resolve, next.reject)
    .finally(() => {
      active -= 1
      runNext()
    })
}

// Wraps an async task (here, a call to analyzeResource) so it only
// starts once fewer than MAX_CONCURRENT other analyses are in flight.
// Returns a promise that resolves/rejects exactly like calling the
// task directly would — callers don't need to know a queue exists.
export function enqueueAnalysis(task) {
  return new Promise((resolve, reject) => {
    waiting.push({ task, resolve, reject })
    runNext()
  })
}