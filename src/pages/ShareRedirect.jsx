// RCFMOUAULIBRARYreact/student-dashboard/src/pages/ShareRedirect.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resourcesApi } from '../services/api'

// Landing page for /s/:token — reached after the backend's public OG-tag
// page (routes/shareLanding.js) redirects a real browser here. This
// route is wrapped in <ProtectedRoute> in AppRoutes.jsx, so an
// unauthenticated visitor is sent to sign in before this ever mounts.
// Once authenticated, it resolves the token to a resource id and hands
// off to the normal ResourceDetail page — same preview, same Read/
// Download buttons every other resource uses. The token never carries a
// file URL, so there's nothing here to intercept or edit into a download.
function ShareRedirect() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    resourcesApi
      .resolveShareToken(token)
      .then(({ resourceId }) => {
        if (!cancelled) navigate(`/library/${resourceId}`, { replace: true })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => { cancelled = true }
  }, [token, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">link_off</span>
        <p className="text-on-surface-variant font-body-md">This link is no longer available.</p>
        <button onClick={() => navigate('/home')} className="text-primary font-label-md">Go to Home</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="material-symbols-outlined text-on-surface-variant text-3xl animate-spin">
        progress_activity
      </span>
    </div>
  )
}

export default ShareRedirect