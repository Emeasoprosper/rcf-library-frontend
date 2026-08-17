// lib/submissions.js
const KEY = 'kdrop_pending_submissions'

export function saveSubmission(entry) {
  const existing = JSON.parse(localStorage.getItem(KEY) || '[]')
  const record = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify([record, ...existing]))
  return record
}

export function getSubmissions() {
  return JSON.parse(localStorage.getItem(KEY) || '[]')
}