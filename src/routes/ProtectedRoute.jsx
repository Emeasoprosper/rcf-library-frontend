// routes/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  // Carries the URL the user was actually trying to reach (e.g. a share
  // link at /s/:token) through the sign-in detour, in router state — not
  // the URL itself, so it never leaks into browser history or a query
  // string. SignIn.jsx reads this to send them back afterward instead of
  // defaulting to /home.
  return isAuthenticated ? children : <Navigate to="/signin" state={{ from: location.pathname }} replace />
}

export default ProtectedRoute