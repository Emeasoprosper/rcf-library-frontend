// lib/offlineStorage.js
import { get, set, del, keys } from 'idb-keyval'

// Downloaded materials live in IndexedDB (via idb-keyval) — one entry for
// the actual file Blob, one for the metadata that drives the Downloads
// page and reader UI, one for reading progress. This is the ONLY
// offline-storage system in the app: no separate download library, no
// second cache. The browser's native Downloads folder is never used for
// resource files.
const FILE_PREFIX = 'resource-file:'
const META_PREFIX = 'resource-meta:'
const PROGRESS_PREFIX = 'resource-progress:'

async function requestPersistence() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist()
  } catch {
    // Not guaranteed by the browser — non-fatal either way.
  }
}

// FIX (root cause of the broken-image-while-offline bug): metadata.thumbnail
// used to be stored as whatever string the caller passed in — which, from
// ResourceDetail.jsx, was `resource.thumbnail_url`, a REMOTE URL. That gets
// rendered directly by <img> in AppOfflineShell.jsx and Downloads.jsx, so
// with zero network the browser shows its native broken-image icon.
//
// This fetches the actual image bytes ONCE, at download time (while we're
// still online), and converts them to a data: URL — a self-contained
// string with no network dependency, safe to store in IndexedDB and safe
// to drop straight into <img src> forever after, online or off.
//
// If the fetch fails (CORS-restricted host, thumbnail briefly 404s, etc.)
// this returns null rather than throwing — a missing thumbnail is not a
// reason to fail the whole download. Callers fall back to the existing
// icon/gradient placeholder UI, never to a broken <img>.
async function resolveThumbnailToDataUrl(remoteUrl) {
  if (!remoteUrl) return null
  try {
    const res = await fetch(remoteUrl, { credentials: 'include' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('[offlineStorage] could not embed thumbnail for offline use:', err)
    return null
  }
}

// Saves a downloaded file + its metadata, then reads both back to confirm
// they actually landed in IndexedDB before returning. Throws (and cleans
// up any partial write) if verification fails — callers must NOT mark an
// item as downloaded unless this resolves successfully.
//
// metadata.thumbnailUrl is the REMOTE source (e.g. resource.thumbnail_url).
// It is resolved to local bytes here and never itself persisted — only the
// resulting local data URL (metadata.thumbnail, no "Url" suffix) is stored.
export async function saveOffline(resourceId, blob, mimeType, metadata = {}) {
  if (!blob || blob.size === 0) throw new Error('Empty file — refusing to save')

  await requestPersistence()

  const localThumbnail = await resolveThumbnailToDataUrl(metadata.thumbnailUrl)

  const fileEntry = { blob, mimeType, savedAt: Date.now() }
  const metaEntry = {
    id: resourceId,
    title: metadata.title || '',
    author: metadata.author || '',
    category: metadata.category || '',
    department: metadata.department || '',
    level: metadata.level || '',
    fileType: mimeType,
    fileSize: blob.size,
    downloadDate: Date.now(),
    thumbnail: localThumbnail, // always local bytes (data URL) or null — never a remote URL
    lastReadPage: 0,
  }

  await set(`${FILE_PREFIX}${resourceId}`, fileEntry)
  await set(`${META_PREFIX}${resourceId}`, metaEntry)

  const verifyFile = await get(`${FILE_PREFIX}${resourceId}`)
  const verifyMeta = await get(`${META_PREFIX}${resourceId}`)
  if (!verifyFile?.blob || verifyFile.blob.size === 0 || !verifyMeta) {
    await del(`${FILE_PREFIX}${resourceId}`)
    await del(`${META_PREFIX}${resourceId}`)
    throw new Error('Storage verification failed')
  }

  return true
}

export async function getOffline(resourceId) {
  return get(`${FILE_PREFIX}${resourceId}`)
}

export async function getOfflineMeta(resourceId) {
  return get(`${META_PREFIX}${resourceId}`)
}

export async function removeOffline(resourceId) {
  await del(`${FILE_PREFIX}${resourceId}`)
  await del(`${META_PREFIX}${resourceId}`)
  await del(`${PROGRESS_PREFIX}${resourceId}`)
}

export async function isOfflineAvailable(resourceId) {
  const entry = await getOffline(resourceId)
  return Boolean(entry?.blob && entry.blob.size > 0)
}

export async function listOfflineIds() {
  const allKeys = await keys()
  return allKeys
    .filter((k) => typeof k === 'string' && k.startsWith(FILE_PREFIX))
    .map((k) => k.replace(FILE_PREFIX, ''))
}

// Everything the Downloads page needs, read entirely from local
// IndexedDB — no network request, works fully offline.
export async function listDownloads() {
  const ids = await listOfflineIds()
  const metas = await Promise.all(ids.map((id) => getOfflineMeta(id)))
  return metas.filter(Boolean).sort((a, b) => b.downloadDate - a.downloadDate)
}

export async function saveReadingProgress(resourceId, page) {
  await set(`${PROGRESS_PREFIX}${resourceId}`, page)
  const meta = await getOfflineMeta(resourceId)
  if (meta) await set(`${META_PREFIX}${resourceId}`, { ...meta, lastReadPage: page })
}

export async function getReadingProgress(resourceId) {
  return get(`${PROGRESS_PREFIX}${resourceId}`)
}