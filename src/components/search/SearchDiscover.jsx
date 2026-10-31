// components/search/SearchDiscover.jsx
// The search page before anything is typed, built around library objects:
// - Jump back in: rounded cards with a small inset cover and what it is.
// - Today at the library: cards drawn like books (coloured spine with the
//   card number, serif title), each with real art from the library.
// - Browse all: solid colour tiles with the cover standing up like a book.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resourcesApi } from '../../services/api'
import { fetchBookOfTheDay } from '../../lib/bookOfTheDay'

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" }

// Rich, solid tile colours, cycled across categories.
export const BROWSE_COLORS = ['#9a3412', '#1e3a8a', '#6d28d9', '#065f46', '#9d174d', '#155e75', '#854d0e', '#1d4ed8', '#4c1d95', '#166534', '#be123c', '#3f6212']

const kindOf = (r) => (/video/.test(r?.file_type || '') ? 'Video' : /audio/.test(r?.file_type || '') ? 'Audio' : 'Book')
const KIND_ICON = { Video: 'movie', Audio: 'headphones', Book: 'menu_book' }

function Thumb({ src, icon, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  return (
    <span className={`flex items-center justify-center bg-gradient-to-br from-[#2b3a67] to-[#1a2140] ${className}`}>
      <span className="material-symbols-outlined text-white/80 text-[22px]">{icon}</span>
    </span>
  )
}

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="text-[22px] md:text-[24px] font-bold text-on-surface leading-tight" style={SERIF}>{children}</h2>
      {right}
    </div>
  )
}

// Two columns of small rounded cards: inset cover, title, and what it is.
export function QuickPicks({ items, onOpen }) {
  const navigate = useNavigate()
  const fixed = [
    { key: 'saved', title: 'Saved', sub: 'Your bookmarks', icon: 'bookmark', bg: 'linear-gradient(135deg,#7c3aed,#c084fc)', to: '/saved' },
    { key: 'downloads', title: 'Offline shelf', sub: 'Read without data', icon: 'download_done', bg: 'linear-gradient(135deg,#0f766e,#34d399)', to: '/downloads' },
  ]
  const card = 'rcf-press flex items-center gap-2.5 p-1.5 pr-2 rounded-xl bg-surface-container border border-outline hover:bg-surface-container-high text-left transition-colors min-w-0'

  return (
    <section>
      <SectionTitle>Jump back in</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {fixed.map((f) => (
          <button key={f.key} type="button" onClick={() => navigate(f.to)} className={card}>
            <span className="w-11 h-11 flex-none rounded-lg flex items-center justify-center" style={{ background: f.bg }}>
              <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-on-surface truncate">{f.title}</span>
              <span className="block text-[11px] text-on-surface-variant truncate">{f.sub}</span>
            </span>
          </button>
        ))}
        {items.slice(0, 6).map((r) => {
          const kind = kindOf(r)
          return (
            <button key={r.id} type="button" onClick={() => onOpen(r)} className={card}>
              <Thumb src={r.thumbnail_url} icon={KIND_ICON[kind]} className="w-11 h-11 flex-none rounded-lg" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-on-surface leading-tight line-clamp-2">{r.title}</span>
                <span className="block text-[11px] text-on-surface-variant truncate">{kind}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// A card drawn like a book: coloured spine with its number on the left,
// small art + label at the top, serif title, one button that never wraps.
function ShelfCard({ n, item }) {
  return (
    <article
      className="relative snap-start flex-none w-[86%] sm:w-[340px] min-h-[196px] rounded-2xl overflow-hidden flex shadow-lg"
      style={{ background: `linear-gradient(160deg, ${item.from}, ${item.to})` }}
    >
      <div className="w-9 flex-none flex flex-col items-center justify-between py-3" style={{ background: 'rgba(0,0,0,0.28)' }}>
        <span className="text-[11px] font-bold text-white/85 tabular-nums">{String(n).padStart(2, '0')}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/55 [writing-mode:vertical-rl] rotate-180">RCF Library</span>
        <span className="w-3 h-[2px] rounded-full bg-white/40" />
      </div>

      <div className="min-w-0 flex-1 p-4 flex flex-col">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 flex-none rounded-lg overflow-hidden bg-black/25 border border-white/15 flex items-center justify-center">
            {item.thumb ? (
              <Thumb src={item.thumb} icon={item.icon} className="w-full h-full" />
            ) : (
              <span className="material-symbols-outlined text-white text-[22px]">{item.icon}</span>
            )}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] truncate" style={{ color: item.accent }}>{item.label}</span>
        </div>

        <h3 className="mt-3 text-white text-[21px] leading-[1.15] font-bold line-clamp-2" style={SERIF}>{item.title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-white/75 line-clamp-2">{item.body}</p>

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={item.onClick}
            className="rcf-press inline-flex items-center gap-1.5 h-9 pl-3.5 pr-3 rounded-full bg-white text-[#141414] text-[13px] font-bold whitespace-nowrap shadow-md"
          >
            {item.action}
            <span className="material-symbols-outlined text-[18px]">{item.actionIcon || 'arrow_forward'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export function GettingStarted({ onOpen }) {
  const navigate = useNavigate()
  const rowRef = useRef(null)
  const [active, setActive] = useState(0)
  const [video, setVideo] = useState(null)
  const [audio, setAudio] = useState(null)
  const [book, setBook] = useState(null)

  useEffect(() => {
    resourcesApi.list({ type: 'video', pageSize: 1, sort: 'recent' }).then((d) => setVideo(d.items?.[0] || null)).catch(() => {})
    resourcesApi.list({ type: 'audio', pageSize: 1, sort: 'popular' }).then((d) => setAudio(d.items?.[0] || null)).catch(() => {})
    fetchBookOfTheDay((p) => resourcesApi.list(p)).then(setBook).catch(() => {})
  }, [])

  const cards = [
    book && {
      key: 'book', label: 'Book of the day', title: book.title, body: book.author ? `by ${book.author}` : 'Picked from the library for today.',
      action: 'Read now', actionIcon: 'auto_stories', icon: 'menu_book', thumb: book.thumbnail_url,
      from: '#8a4a12', to: '#3b1d07', accent: '#ffc98a', onClick: () => onOpen(book),
    },
    {
      key: 'path', label: 'Reading path', title: 'Find what to read next', body: 'Five questions, then books picked for your goals.',
      action: 'Start', icon: 'explore', from: '#166534', to: '#0a2e17', accent: '#86efac', onClick: () => navigate('/reading-path'),
    },
    video && {
      key: 'video', label: 'Watch', title: video.title, body: 'Video lessons and teachings from the library.',
      action: 'Play', actionIcon: 'play_arrow', icon: 'movie', thumb: video.thumbnail_url,
      from: '#0e7490', to: '#083344', accent: '#99f6e4', onClick: () => onOpen(video),
    },
    audio && {
      key: 'audio', label: 'Listen', title: audio.title, body: 'Play it while you walk to class.',
      action: 'Listen', actionIcon: 'headphones', icon: 'headphones', thumb: audio.thumbnail_url,
      from: '#6b21a8', to: '#2e1065', accent: '#e9d5ff', onClick: () => onOpen(audio),
    },
    {
      key: 'offline', label: 'Offline', title: 'Read without data', body: 'Download once, open anytime, even with no network.',
      action: 'Open shelf', icon: 'download_for_offline', from: '#1e40af', to: '#0b1a4a', accent: '#bfdbfe', onClick: () => navigate('/downloads'),
    },
  ].filter(Boolean)

  const onScroll = () => {
    const el = rowRef.current
    const first = el?.firstElementChild
    if (!el || !first) return
    const step = first.getBoundingClientRect().width + 12
    setActive(Math.min(cards.length - 1, Math.round(el.scrollLeft / step)))
  }
  const goTo = (i) => {
    const el = rowRef.current
    const first = el?.firstElementChild
    if (!el || !first) return
    el.scrollTo({ left: i * (first.getBoundingClientRect().width + 12), behavior: 'smooth' })
  }

  return (
    <section>
      <SectionTitle
        right={
          <div className="hidden sm:flex items-center gap-1">
            {[['chevron_left', -1], ['chevron_right', 1]].map(([icon, dir]) => (
              <button
                key={icon}
                type="button"
                onClick={() => goTo(Math.max(0, Math.min(cards.length - 1, active + dir)))}
                disabled={dir < 0 ? active === 0 : active === cards.length - 1}
                aria-label={dir < 0 ? 'Previous' : 'Next'}
                className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </button>
            ))}
          </div>
        }
      >
        Today at the library
      </SectionTitle>
      <div ref={rowRef} onScroll={onScroll} className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-1">
        {cards.map((c, i) => <ShelfCard key={c.key} n={i + 1} item={c} />)}
      </div>
      <div className="flex justify-center gap-1.5 mt-3" aria-hidden="true">
        {cards.map((c, i) => (
          <button
            key={c.key}
            type="button"
            tabIndex={-1}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-on-surface' : 'w-1.5 bg-on-surface/25'}`}
          />
        ))}
      </div>
    </section>
  )
}

// Solid colour tile; the cover stands upright in the corner like a book,
// with a light page edge and a soft shadow.
export function BrowseTile({ title, color, imageUrl, icon = 'category', onClick }) {
  const [failed, setFailed] = useState(false)
  return (
    <button type="button" onClick={onClick} className="rcf-press relative overflow-hidden rounded-xl h-24 sm:h-28 p-3 text-left" style={{ background: color }}>
      <h3 className="relative z-10 text-white text-[15px] sm:text-[17px] font-bold leading-tight max-w-[62%] break-words">{title}</h3>
      <span className="absolute right-3 bottom-0 translate-y-[18%] w-[52px] sm:w-[60px] aspect-[3/4] rounded-[3px] shadow-[-6px_6px_14px_rgba(0,0,0,0.45)] overflow-hidden bg-black/25 flex items-center justify-center">
        {imageUrl && !failed ? (
          <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-white/90 text-[24px]">{icon}</span>
        )}
        <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-white/10 to-white/60" aria-hidden="true" />
        <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-black/25" aria-hidden="true" />
      </span>
    </button>
  )
}
