// RCFMOUAULIBRARYreact/student-dashboard/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

// FIX (confirmed offline-reopen bug): authApi.me() used to run once on
// mount and, on ANY failure, call setUser(null) — with no distinction
// between "not logged in" and "no network to check". On a fully offline
// cold reopen (spec section 22: kill app, disable all connectivity,
// reopen), the me() fetch fails at the network level, the user got
// signed out client-side, and ProtectedRoute then redirected to /signin
// before ever reaching /downloads — even though the whole point of the
// offline library is that it shouldn't need a live session check.
//
// This flag is NOT the user's session or any personal data — it's a
// single boolean breadcrumb ("the last time we could reach the server,
// this browser had a valid session") used only to bridge that one gap:
// a legitimate offline reopen. It's set on every successful me()/login
// and cleared on logout or a genuine (non-network) auth failure.
const OFFLINE_AUTH_FLAG_KEY = 'rcf_was_authenticated'

function readOfflineAuthFlag() {
  try {
    return localStorage.getItem(OFFLINE_AUTH_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function writeOfflineAuthFlag(value) {
  try {
    if (value) localStorage.setItem(OFFLINE_AUTH_FLAG_KEY, '1')
    else localStorage.removeItem(OFFLINE_AUTH_FLAG_KEY)
  } catch {
    // non-fatal
  }
}

// A rejected fetch() (DNS failure, no connection, backend totally
// unreachable) throws a TypeError before any HTTP status exists. A real
// "you are not logged in" outcome instead resolves with a response and
// goes through apiFetch's `!res.ok` / 401 branch, which throws a plain
// Error with an actual message — never a TypeError. This is the same
// distinction api.js's own 401-retry logic relies on, just checked here
// for a different purpose.
function isNetworkFailure(err) {
  return !navigator.onLine || err instanceof TypeError
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True when we couldn't reach the server to verify the session, but a
  // previous successful check on this device said the user was signed
  // in. Kept separate from `user` (which stays null — we don't fabricate
  // profile data) but folded into isAuthenticated below so ProtectedRoute
  // treats this as a valid session for the offline reopen case.
  const [offlineAuthenticated, setOfflineAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => {
        setUser(user)
        setOfflineAuthenticated(false)
        writeOfflineAuthFlag(Boolean(user))
      })
      .catch((err) => {
        if (isNetworkFailure(err) && readOfflineAuthFlag()) {
          // Can't reach the server, but this device was signed in the
          // last time it could check — trust that for now rather than
          // forcing a sign-out over a connectivity problem.
          setOfflineAuthenticated(true)
        } else {
          // Either a real "not authenticated" response, or a network
          // failure with no prior signed-in state to fall back on.
          setUser(null)
          setOfflineAuthenticated(false)
          writeOfflineAuthFlag(false)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Reconciles the offline-trusted state once real connectivity returns,
  // so it never lingers indefinitely — if the session genuinely expired
  // while offline, this brings the app back to a real signed-out state
  // instead of trusting the stale flag forever.
  useEffect(() => {
    function handleOnline() {
      if (!offlineAuthenticated) return
      authApi
        .me()
        .then(({ user }) => {
          setUser(user)
          setOfflineAuthenticated(false)
          writeOfflineAuthFlag(Boolean(user))
        })
        .catch((err) => {
          if (isNetworkFailure(err)) return // still not really reachable, keep trusting offline state
          setUser(null)
          setOfflineAuthenticated(false)
          writeOfflineAuthFlag(false)
        })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [offlineAuthenticated])

  useEffect(() => {
    function handleExpired() {
      setUser(null)
      setOfflineAuthenticated(false)
      writeOfflineAuthFlag(false)
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const loginWithGoogleToken = async (idToken) => {
    const { user } = await authApi.googleSignIn(idToken)
    setUser(user)
    setOfflineAuthenticated(false)
    writeOfflineAuthFlag(true)
    return user
  }

  const loginWithEmail = async (email, password) => {
    const { user } = await authApi.emailLogin(email, password)
    setUser(user)
    setOfflineAuthenticated(false)
    writeOfflineAuthFlag(true)
    return user
  }

  const signupWithEmail = async (email, password, name) => {
    const { user } = await authApi.emailSignup(email, password, name)
    setUser(user)
    setOfflineAuthenticated(false)
    writeOfflineAuthFlag(true)
    return user
  }

  const refreshUser = async () => {
    const { user } = await authApi.me()
    setUser(user)
    setOfflineAuthenticated(false)
    writeOfflineAuthFlag(Boolean(user))
    return user
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setOfflineAuthenticated(false)
      writeOfflineAuthFlag(false)
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
        // FIX: was `!!user` only — a fully offline reopen never gets a
        // `user` object (there's no network to fetch one from), so this
        // now also accepts the offline-trusted flag. ProtectedRoute reads
        // only this boolean, so downloaded resources stay reachable
        // without a live session check.
        isAuthenticated: !!user || offlineAuthenticated,
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