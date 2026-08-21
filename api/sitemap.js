// student-dashboard/api/sitemap.js
//
// Serves https://rcf-mouau-library.vercel.app/sitemap.xml
//
// Proxies the backend's already-working /sitemap.xml (rcf-library-
// backend/src/routes/sitemap.js), which already queries
// `WHERE status = 'approved'` and lists one <url> per resource. We
// don't re-query the DB or guess an endpoint — we just rewrite every
// backendOrigin + "/library/" URL to frontendOrigin + "/library/".
// Because this proxies live on every request (short cache below), a
// newly-approved resource shows up automatically — no manual entry,
// no redeploy needed.

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://rcf-library-backend.onrender.com'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://rcf-mouau-library.vercel.app'

export default async function handler(req, res) {
  try {
    const backendResp = await fetch(`${BACKEND_ORIGIN}/sitemap.xml`)
    const xml = await backendResp.text()

    const rewritten = xml
      .split(`${BACKEND_ORIGIN}/library/`)
      .join(`${FRONTEND_ORIGIN}/library/`)

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600')
    res.status(200).send(rewritten)
  } catch {
    // Backend unreachable — return a syntactically valid empty sitemap
    // rather than a 502, so crawlers don't choke on garbage; no-store
    // so the next crawl attempt hits the backend fresh.
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    )
  }
}