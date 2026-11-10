// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/PopupMusicButton.jsx
// inline = a small pill placed by the popup itself (e.g. next to its close
// button) instead of floating at the bottom of the screen, where it could
// cover the popup's own buttons.
function PopupMusicButton({ music, inline = false, className = '' }) {
  if (!music || music.failed) return null

  const label = music.blocked ? 'Tap for music' : music.playing ? 'Music on' : 'Music off'
  const icon = music.playing ? 'volume_up' : music.blocked ? 'music_note' : 'volume_off'

  if (inline) {
    return (
      <button
        type="button"
        onClick={music.toggle}
        aria-label={music.playing ? 'Mute music' : 'Play music'}
        className={`flex items-center gap-1.5 pl-2.5 pr-3.5 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-[13px] font-medium active:scale-95 transition-transform ${className}`}
      >
        <span className={`material-symbols-outlined text-[18px] ${music.playing ? 'animate-pulse' : ''}`}>{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={music.toggle}
      aria-label={music.playing ? 'Mute music' : 'Play music'}
      className="fixed left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 pl-3 pr-4 h-11 rounded-full bg-black/70 backdrop-blur text-white font-label-md text-label-md shadow-lg active:scale-95 transition-transform"
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <span className={`material-symbols-outlined text-[20px] ${music.playing ? 'animate-pulse' : ''}`}>{icon}</span>
      {label}
    </button>
  )
}

export default PopupMusicButton
