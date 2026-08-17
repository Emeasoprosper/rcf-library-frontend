// routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null
  return isAuthenticated ? children : <Navigate to="/signin" replace />
}

export default ProtectedRoute