import { createContext, useContext, useEffect, useState } from 'react'

const PageHeaderContext = createContext(null)

export function PageHeaderProvider({ children }) {
  const [header, setHeader] = useState(null)
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) throw new Error('usePageHeaderContext must be used within a PageHeaderProvider')
  return ctx
}

// Called by each page to declare its header. Runs on every render (no
// dependency array) so it always reflects the latest props — including
// inline rightIcons JSX, which gets a new identity every render and
// would otherwise need every caller to useMemo it. The single TopAppBar
// instance lives in App.jsx and never unmounts, so this just updates
// what it displays instead of remounting anything.
export function usePageHeader({ title, rightIcons, showBack = false, titleRef, tabs, activeTab, onTabChange }) {
  const { setHeader } = usePageHeaderContext()

  useEffect(() => {
    setHeader({ title, rightIcons, showBack, titleRef, tabs, activeTab, onTabChange })
    return () => setHeader(null)
  })
}