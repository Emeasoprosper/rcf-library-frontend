// Backs "the sidebar is the reader": any page calls openResource(resource)
// instead of navigating to a full-page reader. Mounted once in App.jsx,
// above RightSidebarPanel, so audio playback survives route changes.
// inspector: admin-only viewer for server errors / source text, opened with
// openInspector({ title, text }). Either one opens the admin right panel.
import { createContext, useContext, useState, useCallback } from 'react'

const ActiveResourceContext = createContext(null)

export function ActiveResourceProvider({ children }) {
  const [activeResource, setActiveResource] = useState(null)
  const [inspector, setInspector] = useState(null)

  const openResource = useCallback((resource) => {
    setActiveResource(resource)
  }, [])

  const closeResource = useCallback(() => {
    setActiveResource(null)
  }, [])

  const openInspector = useCallback((payload) => {
    setInspector(payload)
  }, [])

  const closeInspector = useCallback(() => {
    setInspector(null)
  }, [])

  return (
    <ActiveResourceContext.Provider
      value={{ activeResource, openResource, closeResource, inspector, openInspector, closeInspector }}
    >
      {children}
    </ActiveResourceContext.Provider>
  )
}

export function useActiveResource() {
  const ctx = useContext(ActiveResourceContext)
  if (!ctx) throw new Error('useActiveResource must be used within ActiveResourceProvider')
  return ctx
}