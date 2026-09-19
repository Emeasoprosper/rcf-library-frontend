import { createContext, useContext, useState, useCallback } from 'react'

const NotificationsModalContext = createContext(null)

export function NotificationsModalProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])

  return (
    <NotificationsModalContext.Provider value={{ open, openModal, closeModal }}>
      {children}
    </NotificationsModalContext.Provider>
  )
}

export function useNotificationsModal() {
  const ctx = useContext(NotificationsModalContext)
  if (!ctx) throw new Error('useNotificationsModal must be used within NotificationsModalProvider')
  return ctx
}