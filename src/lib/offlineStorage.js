import { get, set, del, keys } from 'idb-keyval'

// Offline cache for downloaded resources — IndexedDB only, never the real
// filesystem. Keyed by resource ID so ResourceReader can check "do I
// already have this?" before hitting the network.
const KEY_PREFIX = 'resource-file:'

export async function saveOffline(resourceId, blob, mimeType) {
  await set(`${KEY_PREFIX}${resourceId}`, { blob, mimeType, savedAt: Date.now() })
}

export async function getOffline(resourceId) {
  return get(`${KEY_PREFIX}${resourceId}`)
}

export async function removeOffline(resourceId) {
  await del(`${KEY_PREFIX}${resourceId}`)
}

export async function isOfflineAvailable(resourceId) {
  const entry = await getOffline(resourceId)
  return Boolean(entry)
}

export async function listOfflineIds() {
  const allKeys = await keys()
  return allKeys
    .filter((k) => typeof k === 'string' && k.startsWith(KEY_PREFIX))
    .map((k) => k.replace(KEY_PREFIX, ''))
}