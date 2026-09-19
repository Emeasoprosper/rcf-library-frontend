// Desktop-only right sidebar (hidden below lg). Reader-only now —
// Updates moved to LeftSidebarNav.jsx. Renders SidebarReader whenever
// ActiveResourceContext has an open resource; otherwise empty.
import SidebarReader from './SidebarReader'
import { useActiveResource } from '../../contexts/ActiveResourceContext'

function RightSidebarPanel() {
  const { activeResource } = useActiveResource()

  return (
    <aside className="hidden lg:flex flex-col fixed top-[72px] right-0 w-80 h-[calc(100vh-72px)] z-30 bg-surface border-l border-outline overflow-y-auto py-6">
      {activeResource ? (
        <SidebarReader />
      ) : (
        <p className="px-margin-mobile font-label-sm text-label-sm text-on-surface-variant">Nothing playing.</p>
      )}
    </aside>
  )
}

export default RightSidebarPanel