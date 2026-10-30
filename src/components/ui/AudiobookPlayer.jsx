// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/AudiobookPlayer.jsx
// Plays a free LibriVox audiobook chapter by chapter, streamed from
// archive.org. Mobile: bottom sheet. Desktop: cover left, chapters right.
import { useEffect, useRef, useState } from 'react'
import { externalApi } from '../../services/api'

function AudiobookPlayer({ item, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    externalApi
      .audiobookTracks(item.identifier)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load this audiobook.') })
    return () => { cancelled = true }
  }, [item.identifier])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const tracks = data?.tracks || []
  const track = tracks[index]

  const play = (i) => {
    setIndex(i)
    // The <audio> src changes on re-render; start it once it's swapped.
    setTimeout(() => audioRef.current?.play().catch(() => {}), 0)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Listen to ${item.title}`}
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        className="rcf-pop w-full max-h-[94vh] overflow-hidden rounded-t-[28px] md:rounded-[32px] md:max-w-4xl bg-surface-container border border-outline shadow-2xl flex flex-col md:grid md:grid-cols-[0.85fr_1.15fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rcf-gradient relative bg-gradient-to-br from-[#4f6cf7] via-[#7c5cf5] to-[#d946ef] flex md:flex-col items-center gap-4 md:justify-center p-5 md:p-8 text-white flex-none">
          <img
            src={item.coverUrl || data?.coverUrl}
            alt=""
            className="w-24 h-24 md:w-56 md:h-56 rounded-2xl object-cover shadow-2xl bg-white/10 flex-none"
          />
          <div className="min-w-0 md:text-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold uppercase tracking-wide">
              <span className="material-symbols-outlined text-[13px]">headphones</span>
              Free audiobook
            </span>
            <h2 className="font-display text-[20px] md:text-[26px] font-extrabold leading-tight mt-2 line-clamp-3">{item.title}</h2>
            {item.author && <p className="font-label-md text-label-md text-white/85 mt-1 line-clamp-1">{item.author}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="px-5 pt-5 md:px-8 md:pt-8">
            {track ? (
              <>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Now playing · {index + 1} of {tracks.length}</p>
                <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{track.title}</p>
                <audio
                  ref={audioRef}
                  key={track.url}
                  src={track.url}
                  controls
                  autoPlay
                  preload="none"
                  onEnded={() => index < tracks.length - 1 && play(index + 1)}
                  className="w-full mt-3"
                />
                <div className="flex items-center justify-between mt-2">
                  <button disabled={index === 0} onClick={() => play(index - 1)} className="rcf-press flex items-center gap-1 px-3 py-2 rounded-full font-label-md text-label-md text-on-surface disabled:opacity-40">
                    <span className="material-symbols-outlined text-[20px]">skip_previous</span> Previous
                  </button>
                  <button disabled={index >= tracks.length - 1} onClick={() => play(index + 1)} className="rcf-press flex items-center gap-1 px-3 py-2 rounded-full font-label-md text-label-md text-on-surface disabled:opacity-40">
                    Next <span className="material-symbols-outlined text-[20px]">skip_next</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="font-label-md text-label-md text-on-surface-variant py-4">{error || 'Loading chapters…'}</p>
            )}
          </div>

          {tracks.length > 0 && (
            <div className="flex-grow overflow-y-auto px-3 pb-4 md:px-5 mt-2 border-t border-outline/60 max-h-[40vh] md:max-h-none">
              {tracks.map((t, i) => (
                <button
                  key={t.url}
                  onClick={() => play(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    i === index ? 'bg-primary/10' : 'hover:bg-surface-container-high'
                  }`}
                >
                  <span className={`w-8 h-8 flex-none rounded-full flex items-center justify-center ${i === index ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[18px]">{i === index ? 'graphic_eq' : 'play_arrow'}</span>
                  </span>
                  <span className="min-w-0 flex-grow font-label-md text-label-md text-on-surface truncate">{t.title}</span>
                  {t.length && <span className="font-label-sm text-label-sm text-on-surface-variant flex-none">{t.length}</span>}
                </button>
              ))}
            </div>
          )}
          <p className="px-5 pb-4 md:px-8 font-label-sm text-label-sm text-on-surface-variant">
            Public-domain recording by LibriVox volunteers. Streams over your data connection (about 30 MB per hour).
          </p>
        </div>
      </div>
    </div>
  )
}

export default AudiobookPlayer
