// student-dashboard/api/robots.js
// Serves https://rcf-mouau-library.vercel.app/robots.txt

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://rcf-mouau-library.vercel.app'

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(
    `User-agent: *\nAllow: /library/\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${FRONTEND_ORIGIN}/sitemap.xml`
  )
}