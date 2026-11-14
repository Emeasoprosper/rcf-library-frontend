// student-dashboard/api/cover.js
//
// Serves a book's (or collection's) cover for link previews, from this
// site, cached on Vercel's CDN for 30 days.
//
// Why: the share pages' og:image used to point straight at the Render
// backend. Render's free plan sleeps, and waking takes ~30-50 s, far longer
// than WhatsApp waits, so shared links often showed no picture. Here the
// first fetch goes to the backend once; after that Vercel answers instantly
// from its cache even while the backend sleeps.
//
// Only the two cover routes can be fetched (no open proxy):
//   /api/cover?src=/api/resources/<id>/thumbnail
//   /api/cover?src=/api/resource-collections/<id>/cover

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://rcf-library-backend.onrender.com'
const ALLOWED = /^\/api\/(resources\/[0-9a-f-]{36}\/thumbnail|resource-collections\/[0-9a-f-]{36}\/cover)$/i

export default async function handler(req, res) {
  const src = String(req.query.src || '')
  if (!ALLOWED.test(src)) {
    res.status(400).send('Bad request')
    return
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)
    const upstream = await fetch(`${BACKEND_ORIGIN}${src}`, { signal: controller.signal })
    clearTimeout(timer)
    const type = upstream.headers.get('content-type') || ''
    if (!upstream.ok || !type.startsWith('image/')) throw new Error(`upstream ${upstream.status}`)
    const body = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', String(body.length))
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000')
    res.status(200).send(body)
  } catch {
    // Backend asleep or no cover: the library logo, never a broken preview.
    // Short cache, so the real cover is tried again soon.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
    res.redirect(302, '/logoapp.jpg')
  }
}
