// student-dashboard/public/push-sw.js
// Loaded by the generated service worker (workbox.importScripts in vite.config.js).
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'RCF Library', body: event.data.text() }
  }

  const options = {
    body: payload.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/badge-96x96.png',
    vibrate: [200, 100, 200],
    data: { url: payload.url || '/notifications' },
    actions: [{ action: 'open', title: 'Open Library' }],
  }
  if (payload.image) options.image = payload.image
  if (payload.tag) {
    options.tag = payload.tag
    options.renotify = true
  }

  event.waitUntil(
    (async () => {
      // App is open and visible: the page plays the RCF sound, so the
      // phone's own sound is silenced to avoid two sounds at once.
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const appVisible = windows.some((c) => c.visibilityState === 'visible')
      if (appVisible) {
        windows.forEach((c) => c.postMessage({ type: 'rcf-push-sound' }))
        options.silent = true
        delete options.vibrate // silent notifications must not set vibrate
      }
      await self.registration.showNotification(payload.title || 'RCF Library', options)
    })()
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/notifications', self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          try {
            await client.focus()
            if ('navigate' in client) await client.navigate(target)
            return
          } catch {
            // fall through to openWindow
          }
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target)
    })()
  )
})
// ---------- Share to the app ----------
// The app is in the phone's Share menu for documents (manifest share_target
// in vite.config.js). A share arrives here as a POST to /share-target: the
// files are kept in a cache and the upload page opens, which picks them up
// (src/lib/sharedFiles.js). Registered here, before Workbox's own handlers.
const SHARED_CACHE = 'rcf-shared-files'
const MAX_SHARED_FILES = 10

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') return
  if (new URL(event.request.url).pathname !== '/share-target') return
  event.respondWith(
    (async () => {
      try {
        const form = await event.request.formData()
        const files = form.getAll('file').filter((f) => f && typeof f === 'object' && f.size > 0)
        await caches.delete(SHARED_CACHE)
        const cache = await caches.open(SHARED_CACHE)
        let i = 0
        for (const f of files.slice(0, MAX_SHARED_FILES)) {
          await cache.put(
            `/shared-file/${i++}`,
            new Response(f, {
              headers: {
                'Content-Type': f.type || 'application/octet-stream',
                'X-File-Name': encodeURIComponent(f.name || `shared-file-${i}`),
              },
            })
          )
        }
      } catch {
        // Nothing usable came through: the upload page still opens.
      }
      return Response.redirect(new URL('/contribute/submit', self.location.origin).href, 303)
    })()
  )
})
