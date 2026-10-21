import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { presenceApi } from '../services/api'

// Runs ONE heartbeat + count poll for the whole app (both the mobile and
// desktop headers read from here, so nothing polls twice). It returns
// null outside the provider, so components like the offline shell that
// render before it just show nothing.
const PresenceContext = createContext(null)
const POLL_MS = 60 * 1000

export function PresenceProvider({ children }) {
  const { user } = useAuth()
  const signedIn = Boolean(user)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const [state, setState] = useState({ enabled: false, online: null, studyEnabled: false })

  const refresh = useCallback(async () => {
    if (!signedIn) return
    if (!navigator.onLine) {
      setState((s) => ({ ...s, online: null }))
      return
    }
    try {
      await presenceApi.heartbeat()
      const res = await presenceApi.get()
      setState({
        enabled: Boolean(res.enabled),
        studyEnabled: Boolean(res.studyEnabled),
        online: typeof res.online === 'number' ? res.online : null,
      })
    } catch {
      setState((s) => ({ ...s, online: null }))
    }
  }, [signedIn])

  useEffect(() => {
    if (!signedIn) {
      setState({ enabled: false, online: null, studyEnabled: false })
      return
    }
    refresh()
    const interval = setInterval(() => { if (!document.hidden) refresh() }, POLL_MS)
    const onVisible = () => { if (!document.hidden) refresh() }
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [signedIn, refresh])

  const value = useMemo(
    () => ({ ...state, isAdmin, studyVisible: state.studyEnabled || isAdmin, refresh }),
    [state, isAdmin, refresh]
  )
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

export function usePresence() {
  return useContext(PresenceContext)
}