// RCFMOUAULIBRARYreact/student-dashboard/src/components/resource/HorizontalRail.jsx
import { useEffect, useRef, useState } from 'react'
import { getMediaKind, MEDIA_KIND_STYLE } from '../../lib/mediaKind'

function splitProgress(subtitle) {
  if (!subtitle) return null
  const match = /^(\d+%)\s*(.*)$/.exec(subtitle)
  if (!match) return null
  return { percent: match[1], rest: match[2] }
}

function Waveform() {
  const bars = [18, 30, 46, 26, 58, 36, 72, 42, 64, 30, 52, 78, 38, 60, 28, 48, 68, 34, 54, 24]

  return (
    <div className="absolute inset-x-3 bottom-3 flex h-10 items-center gap-0.5 opacity-90" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-full bg-orange-300/90"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

// Curved shelf: the cards sit on an arc of a circle seen from the front,
// like books standing round a curved shelf. Only the card in the middle
// faces you; every card further out is turned more, pushed further back and
// drawn closer together, so the row visibly curves away on both sides and
// fades out at the edges. Recomputed every scroll frame from where each card
// sits on screen, so cards roll round the curve as you swipe.
const ARC_DEG = 48 // how far round the circle the screen edge is (90 = half circle)

function bendCards(scroller, slots, cards) {
  const box = scroller.getBoundingClientRect()
  const half = box.width / 2
  if (!half) return
  const mid = box.left + half
  const maxAngle = (ARC_DEG * Math.PI) / 180
  const radius = half / Math.sin(maxAngle) // so the screen edge lands on the arc's edge
  slots.forEach((slot, i) => {
    const card = cards[i]
    if (!slot || !card) return
    const r = slot.getBoundingClientRect()
    const d = Math.max(-1.6, Math.min(1.6, (r.left + r.width / 2 - mid) / half)) // -1 left edge ... 1 right edge
    const angle = d * maxAngle
    // Where the card would be on the circle, versus where the straight row put it.
    const shiftX = radius * Math.sin(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle))) - d * half
    const depth = radius * (1 - Math.cos(Math.min(Math.PI / 2, Math.abs(angle))))
    const a = Math.min(1, Math.abs(d))
    const turn = Math.max(-72, Math.min(72, (angle * 180) / Math.PI))
    card.style.transform = `perspective(900px) translateX(${shiftX.toFixed(1)}px) translateZ(${(-depth).toFixed(1)}px) rotateY(${turn.toFixed(1)}deg)`
    // Fully visible through the middle, fading only as cards near the edges.
    card.style.opacity = String(Math.max(0.2, 1 - Math.max(0, a - 0.55) * 1.4).toFixed(2))
    card.style.zIndex = String(100 - Math.round(a * 50))
  })
}

function HorizontalRail({ title, items, imageUrl }) {
  const [imageFailed, setImageFailed] = useState(false)
  const scrollerRef = useRef(null)
  const slotRefs = useRef([])
  const cardRefs = useRef([])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => bendCards(scroller, slotRefs.current, cardRefs.current))
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [items])

  if (!items || items.length === 0) return null

  return (
    <section className="mb-stack-lg">
      {/* No title = the caller draws its own heading above the rail. */}
      {(title || imageUrl) && <div className="px-margin-mobile mb-stack-sm flex items-center gap-3">
        {imageUrl && !imageFailed && (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-10 h-10 flex-none rounded-full object-cover border border-outline"
          />
        )}
        <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">{title}</h2>
      </div>}
      <div className="relative">
        {/*
          padding-left/right on this container used to be silently
          dropped at rest scroll position in iOS Safari once
          overflow-x-auto + snap-x-mandatory are both present — the
          first/last card would sit flush against the screen edge even
          though the section title above (not a scroll container)
          showed the correct margin. Real spacer flex items instead of
          padding fixes it reliably across browsers. snap-align: none
          on the spacers keeps them out of the scroll-snap sequence so
          they never become a snap stop themselves.
        */}
        <div
          ref={scrollerRef}
          className="flex gap-gutter overflow-x-auto no-scrollbar snap-x snap-mandatory py-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        >
          <div className="flex-none w-margin-mobile" style={{ scrollSnapAlign: 'none' }} aria-hidden="true" />

          {items.map((item, index) => {
            const kind = getMediaKind(item.fileType)
            const style = MEDIA_KIND_STYLE[kind]
            const progress = splitProgress(item.subtitle)

            const contributorLabel = item.isAdminUpload
              ? 'Admin'
              : item.contributorName || null

            return (
              <div
                key={item.id || item.title}
                ref={(el) => { slotRefs.current[index] = el }}
                onClick={item.onClick}
                className={`flex-none ${item.isCollection ? 'w-52' : style.railWidth} snap-start group cursor-pointer`}
              >
                <div
                  ref={(el) => { cardRefs.current[index] = el }}
                  className="relative rounded-xl overflow-hidden mb-stack-sm will-change-transform [transform-style:preserve-3d] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]"
                >
                  <div className={`relative ${item.isCollection ? 'aspect-[4/3]' : style.aspect} w-full bg-surface-container`}>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                          {item.thumbnailStatus === 'processing' ? 'hourglass_top' : style.gridIcon}
                        </span>
                      </div>
                    )}

                    {kind === 'video' && item.thumbnailUrl && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">play_arrow</span>
                        </span>
                      </span>
                    )}
                    {kind === 'audio' && item.thumbnailUrl && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">headphones</span>
                        </span>
                      </span>
                    )}
                    {kind === 'audio' && !item.thumbnailUrl && <Waveform />}

                  </div>

                  <div className="bg-surface-container-high px-2 py-1.5">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">{item.title}</h4>

                    {progress ? (
                      <p className="font-label-sm text-label-sm truncate">
                        <span className="text-orange-400 font-bold">{progress.percent}</span>
                        {progress.rest && <span className="text-on-surface-variant"> {progress.rest}</span>}
                      </p>
                    ) : (
                      item.subtitle && (
                        <p className="font-label-sm text-label-sm text-[#8CA0BD] truncate">{item.subtitle}</p>
                      )
                    )}

                    {contributorLabel && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.contributorAvatarUrl ? (
                          <img
                            src={item.contributorAvatarUrl}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover flex-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-surface-container-highest flex-none flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[10px]">
                              {item.isAdminUpload ? 'shield_person' : 'person'}
                            </span>
                          </span>
                        )}
                        <span className="font-label-sm text-label-sm text-[#8CA0BD] truncate">
                          {contributorLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex-none w-margin-mobile" style={{ scrollSnapAlign: 'none' }} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default HorizontalRail