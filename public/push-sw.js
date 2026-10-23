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
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: { url: payload.url || '/notifications' },
    actions: [{ action: 'open', title: 'Open Library' }],
  }
  if (payload.image) options.image = payload.image
  if (payload.tag) {
    options.tag = payload.tag
    options.renotify = true
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'RCF Library', options))
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