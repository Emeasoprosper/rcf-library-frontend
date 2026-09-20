// Desktop-only right sidebar (hidden below lg).
// Normal mode: reader when a resource is open, otherwise the empty state.
// Admin mode (/admin/*): collapsed to zero width; opens only to inspect a
// resource (openResource) or view server errors/source (openInspector).
import { useLocation } from 'react-router-dom'
import SidebarReader from './SidebarReader'
import { useActiveResource } from '../../contexts/ActiveResourceContext'

function NothingPlayingState() {
  const subtitle = 'Read and listen to audios here'
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/nothingplaying.png" alt="" className="w-full max-w-none object-contain opacity-90" />
      <p className="font-headline-md text-headline-md font-display text-on-surface">Nothing playing.</p>
      <p className="flex flex-wrap justify-center font-label-md text-label-md text-on-surface-variant">
        {subtitle.split('').map((ch, i) => (
          <span
            key={i}
            className="nothing-playing-particle inline-block"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </p>
    </div>
  )
}

function RightSidebarPanel() {
  const { pathname } = useLocation()
  const { activeResource, closeResource, inspector, closeInspector } = useActiveResource()
  const isAdmin = pathname.startsWith('/admin')
  const open = !isAdmin || !!activeResource || !!inspector

  function closeAll() {
    closeResource()
    closeInspector()
  }

  return (
    <aside
      style={{ width: 'var(--sb-right)' }}
      className={`hidden lg:flex flex-col fixed top-[72px] right-0 h-[calc(100vh-72px)] z-30 bg-surface overflow-hidden transition-[width] duration-300 ease-in-out ${
        open ? 'border-l border-outline' : ''
      }`}
    >
      <div className="w-full min-w-80 h-full flex-none flex flex-col overflow-y-auto py-6">
        {isAdmin && open && (
          <div className="flex items-center justify-between px-4 pb-3">
            <p className="font-label-md text-label-md text-on-surface-variant">
              {inspector ? inspector.title : 'Inspector'}
            </p>
            <button
              onClick={closeAll}
              className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center"
              aria-label="Close inspector"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
            </button>
          </div>
        )}

        {isAdmin && inspector ? (
          <pre className="px-4 font-mono text-xs text-on-surface whitespace-pre-wrap break-words">
            {inspector.text}
          </pre>
        ) : activeResource ? (
          <SidebarReader />
        ) : !isAdmin ? (
          <NothingPlayingState />
        ) : null}
      </div>
    </aside>
  )
}

export default RightSidebarPanel