// Backs "the sidebar is the reader": any page calls openResource(resource)
// instead of navigating to a full-page reader. Mounted once in App.jsx,
// above RightSidebarPanel, so audio playback survives route changes.
import { createContext, useContext, useState, useCallback } from 'react'

const ActiveResourceContext = createContext(null)

export function ActiveResourceProvider({ children }) {
  const [activeResource, setActiveResource] = useState(null)

  const openResource = useCallback((resource) => {
    setActiveResource(resource)
  }, [])

  const closeResource = useCallback(() => {
    setActiveResource(null)
  }, [])

  return (
    <ActiveResourceContext.Provider value={{ activeResource, openResource, closeResource }}>
      {children}
    </ActiveResourceContext.Provider>
  )
}

export function useActiveResource() {
  const ctx = useContext(ActiveResourceContext)
  if (!ctx) throw new Error('useActiveResource must be used within ActiveResourceProvider')
  return ctx
}