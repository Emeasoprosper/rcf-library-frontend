import { useEffect, useRef, useState } from 'react'

// Auto-sliding, center-peek news carousel. Each card takes ~85% of the
// row width so the next/previous cards peek in from the sides.
function NewsCarousel({ items }) {
  const trackRef = useRef(null)
  const autoplayRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const goTo = (index) => {
    const track = trackRef.current
    const card = track?.children[index]
    if (!track || !card) return
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!items || items.length <= 1) return
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length
        goTo(next)
        return next
      })
    }, 5000)
    return () => clearInterval(autoplayRef.current)
  }, [items?.length])

  const stopAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current)
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || !items?.length) return
    const cardWidth = track.children[0]?.offsetWidth || 1
    const index = Math.round(track.scrollLeft / (cardWidth + 12))
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1))
  }

  if (!items || items.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onTouchStart={stopAutoplay}
        onMouseDown={stopAutoplay}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-margin-mobile [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex-none w-[85%] snap-center text-left rounded-2xl bg-surface-container border border-outline overflow-hidden flex items-center gap-4 p-3.5 shadow-lg active:scale-[0.98] transition-transform"
          >
            {/* Multi-layered stack thumbnail: two rotated backing layers
                peeking out behind the front image/icon, so even a plain
                square photo reads as a little stack of clippings. */}
            <div className="relative w-20 h-20 flex-shrink-0 my-1 ml-1">
              <div className="absolute inset-0 bg-white/80 rounded-xl -rotate-12 scale-90 -translate-x-[3px] -translate-y-[2px] border border-white/50" />
              <div className="absolute inset-0 bg-white rounded-xl -rotate-6 scale-95 -translate-x-[2px] border border-white/60" />

              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="relative z-10 w-full h-full object-cover rounded-xl border border-outline shadow-xl"
                />
              ) : (
                <div className="relative z-10 w-full h-full rounded-xl border border-outline shadow-xl bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">newspaper</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              {item.badge && (
                <span className="block text-[11px] font-bold uppercase tracking-wide text-orange-500">
                  {item.badge}
                </span>
              )}
              <h3 className="font-body-md text-body-md font-bold text-on-surface truncate leading-snug">
                {item.title}
              </h3>
              {item.body && (
                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-tight">
                  {item.body}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-stack-sm">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? 'w-6 bg-orange-500' : 'w-2 bg-surface-container-highest'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NewsCarousel