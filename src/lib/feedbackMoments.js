// lib/feedbackMoments.js
// Decides WHEN to ask for a rating/review. <FeedbackPrompt /> (mounted once
// in App) does the asking. The moments:
//   - the second day someone uses the app (once),
//   - a little after they do something for the first time (first download,
//     first upload, first save…),
//   - otherwise at most every 2 days of use.
// Never more than once every 2 days; a week's rest after they've sent one.
// A request from Settings ("Rate the app") always opens it straight away.

export const FEEDBACK_EVENT = 'rcf:feedback-moment'

const KEYS = {
  days: 'rcf_fb_days',            // JSON list of 'YYYY-MM-DD' days the app was used
  lastPrompt: 'rcf_fb_last_prompt', // ms timestamp the prompt last opened
  lastSubmit: 'rcf_fb_last_submit', // ms timestamp they last sent one
  firsts: 'rcf_fb_firsts',        // JSON list of features already used once
  secondDay: 'rcf_fb_second_day', // '1' once the second-day ask has happened
}
const DAY = 24 * 60 * 60 * 1000
const PROMPT_GAP = 2 * DAY
const AFTER_SUBMIT_GAP = 7 * DAY
const FIRST_USE_GAP = 1 * DAY

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage blocked */ }
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
const since = (key) => Date.now() - Number(read(key, 0) || 0)

// Call once per app start: remembers today as a day the app was used.
export function recordVisitDay() {
  const days = read(KEYS.days, [])
  const d = today()
  if (!days.includes(d)) write(KEYS.days, [...days, d].slice(-60))
}

function emit(trigger, options = {}) {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { trigger, ...options } }))
}

// What this session should ask about, if anything (checked after a while of use).
export function sessionMoment() {
  const days = read(KEYS.days, []).length
  if (days < 2) return null
  if (since(KEYS.lastPrompt) < PROMPT_GAP || since(KEYS.lastSubmit) < AFTER_SUBMIT_GAP) return null
  if (!read(KEYS.secondDay, false)) return 'second_day'
  return 'regular'
}

export function checkSessionMoment() {
  const trigger = sessionMoment()
  if (trigger) emit(trigger)
}

// The first time someone uses a feature: ask how it went (if it's been a while).
// feature: 'download' | 'upload' | 'save' | …
export function noteFirstUse(feature) {
  const firsts = read(KEYS.firsts, [])
  if (firsts.includes(feature)) return
  write(KEYS.firsts, [...firsts, feature])
  if (since(KEYS.lastPrompt) < FIRST_USE_GAP || since(KEYS.lastSubmit) < AFTER_SUBMIT_GAP) return
  emit(`first_${feature}`)
}

// From Settings: always opens. complaint: start with "complaint" switched on.
export function openFeedback(trigger = 'settings', { complaint = false } = {}) {
  emit(trigger, { manual: true, complaint })
}

export function markPromptShown(trigger) {
  write(KEYS.lastPrompt, Date.now())
  if (trigger === 'second_day') write(KEYS.secondDay, true)
}

export function markSubmitted() {
  write(KEYS.lastSubmit, Date.now())
}
