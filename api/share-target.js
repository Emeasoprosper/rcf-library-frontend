// student-dashboard/api/share-target.js
//
// Normally a file shared to the app from the Share menu is caught by the
// service worker (public/push-sw.js) and never reaches the server. If the
// service worker wasn't running yet, the share lands here instead: open the
// upload page so they can still pick the file there.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.writeHead(303, { Location: '/contribute/submit' })
  res.end()
}
