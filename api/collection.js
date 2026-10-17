// RCFMOUAULIBRARYreact/student-dashboard/api/collection.js
// Serves https://rcf-mouau-library.vercel.app/collections/:id
// Same approach as api/book.js: pull the SEO tags from the backend's
// /collections/:id page and inject them into the real index.html.

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://rcf-library-backend.onrender.com'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://rcf-mouau-library.vercel.app'
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
    const backendResp = await fetchWithTimeout(`${BACKEND_ORIGIN}/collections/${id}`, BACKEND_FETCH_TIMEOUT_MS)
    backendStatus = backendResp.status
    backendHtml = await backendResp.text()
  } catch {
    if (req.query.debug) { res.status(200).send('FALLBACK: backend fetch failed or timed out'); return }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(indexHtml)
    return
  }

  if (backendStatus === 404) {
    if (req.query.debug) { res.status(200).send('FALLBACK: backend answered 404'); return }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.status(404).send(indexHtml)
    return
  }

  const backendCanonical = `${BACKEND_ORIGIN}/collections/${id}`
  const frontendCanonical = `${FRONTEND_ORIGIN}/collections/${id}`

  const titleTag = extractTag(backendHtml, /<title>[\s\S]*?<\/title>/)
  if (req.query.debug) { res.status(200).send('BACKEND STATUS ' + backendStatus + ' | TITLE: ' + titleTag + ' | LENGTH: ' + backendHtml.length); return }
  const canonicalTag = extractTag(backendHtml, /<link rel="canonical"[^>]*>/)
  const descriptionTag = extractTag(backendHtml, /<meta name="description"[^>]*>/)
  const ogTags = extractAllTags(backendHtml, /<meta property="og:[^"]*"[^>]*>/g)
  const twitterTags = extractAllTags(backendHtml, /<meta name="twitter:[^"]*"[^>]*>/g)
  const jsonLdTag = extractTag(backendHtml, /<script type="application\/ld\+json">[\s\S]*?<\/script>/)

  let seoBlock = [titleTag, canonicalTag, descriptionTag, ...ogTags, ...twitterTags, jsonLdTag]
    .filter(Boolean)
    .join('\n  ')
  seoBlock = seoBlock.split(backendCanonical).join(frontendCanonical)

  let finalHtml = indexHtml.replace(/<title>[\s\S]*?<\/title>/, '')
  finalHtml = finalHtml.replace('<head>', `<head>\n  ${seoBlock}`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).send(finalHtml)
}