// Files shared into the app from the phone's (or computer's) Share menu.
//
// The app is listed as a share target in the web app manifest
// (vite.config.js -> share_target). When someone shares a PDF, Word file,
// etc. and picks "RCF Library", the service worker (public/push-sw.js)
// receives the files, keeps them in this cache and opens the upload page,
// which takes them from here with takeSharedFiles().
export const SHARED_CACHE = 'rcf-shared-files'

// Returns the shared files (File objects) and clears them, or [] if none.
export async function takeSharedFiles() {
  try {
    if (!('caches' in window) || !(await caches.has(SHARED_CACHE))) return []
    const cache = await caches.open(SHARED_CACHE)
    const keys = await cache.keys()
    const files = []
    for (const req of keys) {
      const res = await cache.match(req)
      if (!res) continue
      const blob = await res.blob()
      const name = decodeURIComponent(res.headers.get('X-File-Name') || 'shared-file')
      files.push(new File([blob], name, { type: res.headers.get('Content-Type') || blob.type || '' }))
    }
    await caches.delete(SHARED_CACHE)
    return files
  } catch {
    return []
  }
}
