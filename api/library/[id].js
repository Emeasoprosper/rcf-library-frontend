// student-dashboard/api/library/[id].js
//
// Serves https://rcf-mouau-library.vercel.app/library/:id
//
// Flow:
// 1. Fetch the backend's already-working SEO page at /library/:id
//    (rcf-library-backend/src/routes/shareLanding.js). That route does
//    the real DB lookup, approved-status check, title/description/OG/
//    JSON-LD generation, and 404 handling — we reuse all of it instead
//    of re-implementing or guessing a JSON endpoint.
// 2. Pull just the SEO-relevant <head> tags out of that HTML (title,
//    canonical, meta description, og:*, twitter:*, JSON-LD).
// 3. Rewrite backendOrigin + "/library/:id" -> frontendOrigin + "/library/:id"
//    wherever it appears in those tags (canonical link, og:url, JSON-LD
//    "url" field). This is a plain string replace, not a blanket domain
//    swap, so the og:image URL (a different path,
//    /api/resources/:id/thumbnail, which must keep pointing at the
//    backend since that's where the actual image bytes are served
//    from) is left alone.
// 4. Fetch this deployment's own real built index.html and inject the
//    rewritten SEO tags into its <head>. The rest of index.html —
//    script tags, asset hashes, PWA manifest link — is untouched, so
//    the real React app boots normally and React Router's new
//    /library/:id route (see AppRoutes.jsx) mounts the real
//    ResourceDetail component. Crawlers see real tags; humans see the
//    real interactive app.

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://rcf-library-backend.onrender.com'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://rcf-mouau-library.vercel.app'

// Render free-tier backends cold-start slowly. Don't let a sleeping
// backend hang the whole page load — fall back to the plain app shell
// (still a fully working page, just without the enriched tags for this
// one request) rather than erroring out for a real visitor.
const BACKEND_FETCH_TIMEOUT_MS = 8000

function extractTag(html, regex) {
  const m = html.match(regex)
  return m ? m[0] : ''
}

function extractAllTags(html, regex) {
  return html.match(regex) || []
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    res.status(400).send('Bad request')
    return
  }

  // The real, currently-deployed index.html — fetched from this same
  // deployment rather than read off disk, so we always get the actual
  // built file (correct hashed asset filenames) with zero assumptions
  // about the serverless function's filesystem bundling.
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const selfOrigin = `${proto}://${req.headers.host}`

  let indexHtml
  try {
    const indexResp = await fetch(`${selfOrigin}/index.html`)
    indexHtml = await indexResp.text()
  } catch {
    res.status(502).send('Unable to load app shell.')
    return
  }

  let backendHtml = null
  let backendStatus = 200
  try {
    const backendResp = await fetchWithTimeout(`${BACKEND_ORIGIN}/library/${id}`, BACKEND_FETCH_TIMEOUT_MS)
    backendStatus = backendResp.status
    backendHtml = await backendResp.text()
  } catch {
    // Backend unreachable/slow — serve the plain app shell so the human
    // visitor still gets a working page; the React app will do its own
    // fetch and show its own loading/error state. No cache, so the
    // next request tries the backend fresh.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(indexHtml)
    return
  }

  if (backendStatus === 404) {
    // Resource doesn't exist or isn't approved. Serve the real app
    // shell (ResourceDetail.jsx already renders a proper "couldn't be
    // found" state), but with a 404 status so this never gets indexed.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.status(404).send(indexHtml)
    return
  }

  const backendCanonical = `${BACKEND_ORIGIN}/library/${id}`
  const frontendCanonical = `${FRONTEND_ORIGIN}/library/${id}`

  const titleTag = extractTag(backendHtml, /<title>[\s\S]*?<\/title>/)
  const canonicalTag = extractTag(backendHtml, /<link rel="canonical"[^>]*>/)
  const descriptionTag = extractTag(backendHtml, /<meta name="description"[^>]*>/)
  const ogTags = extractAllTags(backendHtml, /<meta property="og:[^"]*"[^>]*>/g)
  const twitterTags = extractAllTags(backendHtml, /<meta name="twitter:[^"]*"[^>]*>/g)
  const jsonLdTag = extractTag(backendHtml, /<script type="application\/ld\+json">[\s\S]*?<\/script>/)

  let seoBlock = [titleTag, canonicalTag, descriptionTag, ...ogTags, ...twitterTags, jsonLdTag]
    .filter(Boolean)
    .join('\n  ')

  // Targeted rewrite: only the exact backend canonical URL string, so
  // og:image (different path) is never touched.
  seoBlock = seoBlock.split(backendCanonical).join(frontendCanonical)

  // Drop the placeholder <title> from index.html so there's exactly one
  // <title> tag, then inject our SEO block right after <head>.
  let finalHtml = indexHtml.replace(/<title>[\s\S]*?<\/title>/, '')
  finalHtml = finalHtml.replace('<head>', `<head>\n  ${seoBlock}`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).send(finalHtml)
}