// routes/AdminRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Splash from '../pages/Splash'

// Gates admin-only pages: must be signed in AND role === 'admin' or 'superadmin'.
// Not authenticated -> /signin. Signed in but not admin -> /home.
// The backend independently re-checks this on every /admin/* API call
// (see requireRole in middleware/auth.js) — this is just the UX guard so
// a signed-in student never even sees the admin shell render.
function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <Splash />
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  if (user?.role !== 'admin' && user?.role !== 'superadmin') return <Navigate to="/home" replace />

  return children
}

export default AdminRoute