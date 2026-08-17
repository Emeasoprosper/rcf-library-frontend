// RCFMOUAULIBRARYreact/student-dashboard/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleExpired() {
      setUser(null)
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const loginWithGoogleToken = async (idToken) => {
    const { user } = await authApi.googleSignIn(idToken)
    setUser(user)
    return user
  }

  const loginWithEmail = async (email, password) => {
    const { user } = await authApi.emailLogin(email, password)
    setUser(user)
    return user
  }

  const signupWithEmail = async (email, password, name) => {
    const { user } = await authApi.emailSignup(email, password, name)
    setUser(user)
    return user
  }

  const refreshUser = async () => {
    const { user } = await authApi.me()
    setUser(user)
    return user
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogleToken,
        loginWithEmail,
        signupWithEmail,
        refreshUser,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}