import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveResource } from '../../contexts/ActiveResourceContext'

// Flips the layout between normal and admin mode. index.css variables do
// the actual resizing; the sidebars and header transition on them.
function LayoutModeSync() {
  const { pathname } = useLocation()
  const { activeResource, inspector } = useActiveResource()
  const isAdmin = pathname.startsWith('/admin')
  const inspecting = isAdmin && (!!activeResource || !!inspector)

  useEffect(() => {
    document.documentElement.classList.toggle('admin-mode', isAdmin)
    document.documentElement.classList.toggle('admin-inspect', inspecting)
  }, [isAdmin, inspecting])

  return null
}

export default LayoutModeSync