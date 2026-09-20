import { createContext, useContext, useState, useCallback } from 'react'

const HeaderAmbientContext = createContext(null)

export function HeaderAmbientProvider({ children }) {
  // { progress: 0..1, color: <css background value> } | null
  const [ambient, setAmbientState] = useState(null)

  const setAmbient = useCallback((value) => setAmbientState(value), [])
  const clearAmbient = useCallback(() => setAmbientState(null), [])

  return (
    <HeaderAmbientContext.Provider value={{ ambient, setAmbient, clearAmbient }}>
      {children}
    </HeaderAmbientContext.Provider>
  )
}

export function useHeaderAmbient() {
  const ctx = useContext(HeaderAmbientContext)
  if (!ctx) throw new Error('useHeaderAmbient must be used within HeaderAmbientProvider')
  return ctx
}