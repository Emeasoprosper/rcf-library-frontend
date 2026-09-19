// Desktop-only right sidebar (hidden below lg). Reader-only now —
// Updates moved to LeftSidebarNav.jsx. Renders SidebarReader whenever
// ActiveResourceContext has an open resource; otherwise empty.
import SidebarReader from './SidebarReader'
import { useActiveResource } from '../../contexts/ActiveResourceContext'

function NothingPlayingState() {
  const subtitle = 'Read and listen to audios here'
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/nothingplaying.png" alt="" className="w-40 h-40 object-contain opacity-90" />
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
  const { activeResource } = useActiveResource()

  return (
    <aside className="hidden lg:flex flex-col fixed top-[72px] right-0 w-80 h-[calc(100vh-72px)] z-30 bg-surface border-l border-outline overflow-y-auto py-6">
      {activeResource ? <SidebarReader /> : <NothingPlayingState />}
    </aside>
  )
}

export default RightSidebarPanel