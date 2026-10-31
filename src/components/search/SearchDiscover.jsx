// components/search/SearchDiscover.jsx
// The search page before anything is typed, in the style of a music app's
// home: quick-pick rows, a "Getting started" carousel of numbered cards
// (each with real art from the library: a video, a sermon, today's book)
// and solid-colour Browse tiles.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resourcesApi } from '../../services/api'
import { fetchBookOfTheDay } from '../../lib/bookOfTheDay'

const CONDENSED = { fontFamily: "'Barlow Condensed', 'Arial Narrow', Inter, sans-serif" }

// Solid, saturated tiles (not pastel gradients), cycled across categories.
export const BROWSE_COLORS = ['#e13300', '#1e3264', '#8400e7', '#006450', '#dc148c', '#477d95', '#ba5d07', '#0d73ec', '#503750', '#27856a', '#e8115b', '#608108']

function Thumb({ src, icon, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  return (
    <span className={`flex items-center justify-center bg-gradient-to-br from-[#2b3a67] to-[#1a2140] ${className}`}>
      <span className="material-symbols-outlined text-white/80 text-[26px]">{icon}</span>
    </span>
  )
}

// Two columns of compact rows: picture on the left, bold title, like a
// music app's "recently played" grid.
export function QuickPicks({ items, onOpen }) {
  const navigate = useNavigate()
  const fixed = [
    { key: 'saved', title: 'Saved', icon: 'favorite', bg: 'linear-gradient(135deg,#4a1fd8,#8ec5e8)', to: '/saved' },
    { key: 'downloads', title: 'Offline shelf', icon: 'download_done', bg: 'linear-gradient(135deg,#0f766e,#34d399)', to: '/downloads' },
  ]
  const kindIcon = (r) => (/video/.test(r.file_type || '') ? 'movie' : /audio/.test(r.file_type || '') ? 'headphones' : 'menu_book')

  return (
    <div className="grid grid-cols-2 gap-2">
      {fixed.map((f) => (
        <button key={f.key} type="button" onClick={() => navigate(f.to)} className="rcf-press group flex items-center gap-3 h-14 rounded-md overflow-hidden bg-surface-container hover:bg-surface-container-high text-left transition-colors">
          <span className="w-14 h-14 flex-none flex items-center justify-center" style={{ background: f.bg }}>
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
          </span>
          <span className="pr-2 text-[13px] font-bold text-on-surface leading-tight line-clamp-2">{f.title}</span>
        </button>
      ))}
      {items.slice(0, 6).map((r) => (
        <button key={r.id} type="button" onClick={() => onOpen(r)} className="rcf-press flex items-center gap-3 h-14 rounded-md overflow-hidden bg-surface-container hover:bg-surface-container-high text-left transition-colors">
          <Thumb src={r.thumbnail_url} icon={kindIcon(r)} className="w-14 h-14 flex-none" />
          <span className="pr-2 text-[13px] font-bold text-on-surface leading-tight line-clamp-2">{r.title}</span>
        </button>
      ))}
    </div>
  )
}

function TipCard({ n, tip, onNext }) {
  return (
    <article
      className="relative snap-start flex-none w-[88%] sm:w-[560px] h-[230px] rounded-xl overflow-hidden p-6 flex flex-col"
      style={{ background: `linear-gradient(180deg, ${tip.from} 0%, ${tip.to} 100%)` }}
    >
      <div className="relative z-10 max-w-[64%]">
        <h3 className="text-white text-[34px] sm:text-[40px] leading-[0.95] font-extrabold tracking-[-0.01em]" style={CONDENSED}>
          {n}. {tip.title}
        </h3>
        <p className="mt-3 text-[15px] leading-snug" style={{ color: tip.text }}>{tip.body}</p>
      </div>
      <div className="relative z-10 mt-auto flex items-center gap-5">
        <button type="button" onClick={tip.onClick} className="rcf-press h-11 px-6 rounded-full text-[15px] font-bold text-black" style={{ background: tip.cta }}>
          {tip.action}
        </button>
        <button type="button" onClick={onNext} className="text-[14px] font-bold hover:underline" style={{ color: tip.text }}>
          Show more tips
        </button>
      </div>
      {/* art peeking in from the right edge */}
      <div className="absolute right-[-28px] top-1/2 -translate-y-1/2 w-[40%] max-w-[190px]">{tip.art}</div>
    </article>
  )
}

function CoverArt({ item, icon, badge }) {
  return (
    <div className="rounded-md bg-black/40 shadow-2xl overflow-hidden border border-white/10">
      <div className="relative aspect-square">
        <Thumb src={item?.thumbnail_url} icon={icon} className="w-full h-full" />
        {badge && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{badge}</span>
          </span>
        )}
      </div>
      {item && (
        <div className="px-2.5 py-2 bg-black/50">
          <p className="text-white text-[12px] font-bold truncate">{item.title}</p>
          <p className="text-white/60 text-[11px] truncate">{item.author || 'RCF Library'}</p>
        </div>
      )}
    </div>
  )
}

// "Getting started": numbered cards with arrows, swipeable on phones.
export function GettingStarted({ onOpen }) {
  const navigate = useNavigate()
  const rowRef = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const [video, setVideo] = useState(null)
  const [audio, setAudio] = useState(null)
  const [book, setBook] = useState(null)

  useEffect(() => {
    resourcesApi.list({ type: 'video', pageSize: 1, sort: 'recent' }).then((d) => setVideo(d.items?.[0] || null)).catch(() => {})
    resourcesApi.list({ type: 'audio', pageSize: 1, sort: 'popular' }).then((d) => setAudio(d.items?.[0] || null)).catch(() => {})
    fetchBookOfTheDay((p) => resourcesApi.list(p)).then(setBook).catch(() => {})
  }, [])

  const tips = [
    book && {
      key: 'book', title: 'Book of the day', body: book.title, action: 'Read now',
      from: '#7a3d0c', to: '#3a1e08', text: '#ffcf8f', cta: '#ffb347',
      onClick: () => onOpen(book), art: <CoverArt item={book} icon="menu_book" />,
    },
    {
      key: 'path', title: 'Find your reading path', body: 'Five questions, then books picked for your goals.', action: 'Start',
      from: '#1d7a3a', to: '#0b3d1d', text: '#7ee2a0', cta: '#1ed760',
      onClick: () => navigate('/reading-path'),
      art: (
        <div className="rounded-md p-3 shadow-2xl rotate-[-4deg]" style={{ background: '#f3ead8', color: '#2a2118' }}>
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">Reader card</p>
          <p className="text-[18px] font-bold leading-tight mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Explorer</p>
          <span className="inline-block mt-2 px-1.5 border-2 rounded text-[9px] font-extrabold uppercase rotate-[-8deg]" style={{ borderColor: '#a8352b', color: '#a8352b' }}>Issued</span>
        </div>
      ),
    },
    video && {
      key: 'video', title: 'Watch a video', body: 'Video lessons and teachings from the library.', action: 'Watch now',
      from: '#0e6b7a', to: '#073840', text: '#8fe3ef', cta: '#5eead4',
      onClick: () => onOpen(video), art: <CoverArt item={video} icon="movie" badge="play_arrow" />,
    },
    audio && {
      key: 'audio', title: 'Listen to a message', body: 'Sermons and audio you can play while you walk.', action: 'Listen',
      from: '#5b2a86', to: '#2a1240', text: '#d8b4fe', cta: '#c084fc',
      onClick: () => onOpen(audio), art: <CoverArt item={audio} icon="headphones" badge="graphic_eq" />,
    },
    {
      key: 'offline', title: 'Read without data', body: 'Download books once and open them offline, anytime.', action: 'My offline shelf',
      from: '#1e3a8a', to: '#0c1a45', text: '#a5c4ff', cta: '#7ab0ff',
      onClick: () => navigate('/downloads'),
      art: <div className="aspect-square rounded-md bg-white/10 border border-white/15 flex items-center justify-center"><span className="material-symbols-outlined text-white text-[64px]">download_for_offline</span></div>,
    },
  ].filter(Boolean)

  const updateEdges = () => {
    const el = rowRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }
  useEffect(updateEdges, [tips.length])

  const scrollBy = (dir) => {
    const el = rowRef.current
    if (!el) return
    const card = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth
    el.scrollBy({ left: dir * (card + 12), behavior: 'smooth' })
  }
  const next = (i) => {
    if (i === tips.length - 1) rowRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
    else scrollBy(1)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[22px] font-bold text-on-surface tracking-tight">Getting started</h2>
        <div className="hidden sm:flex items-center gap-1">
          {[['chevron_left', -1, edge.start], ['chevron_right', 1, edge.end]].map(([icon, dir, disabled]) => (
            <button key={icon} type="button" onClick={() => scrollBy(dir)} disabled={disabled} aria-label={dir < 0 ? 'Previous' : 'Next'} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-container">
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={rowRef} onScroll={updateEdges} className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
        {tips.map((tip, i) => <TipCard key={tip.key} n={i + 1} tip={tip} onNext={() => next(i)} />)}
      </div>
    </section>
  )
}

// Solid colour tile with the cover tilted into the bottom-right corner.
export function BrowseTile({ title, color, imageUrl, icon = 'category', onClick }) {
  const [failed, setFailed] = useState(false)
  return (
    <button type="button" onClick={onClick} className="rcf-press relative overflow-hidden rounded-lg h-24 sm:h-28 p-3 text-left" style={{ background: color }}>
      <h3 className="relative z-10 text-white text-[16px] sm:text-[18px] font-bold leading-tight max-w-[70%] break-words">{title}</h3>
      <span className="absolute -right-3 -bottom-2 w-16 h-16 sm:w-20 sm:h-20 rotate-[25deg] rounded shadow-[0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden bg-black/25 flex items-center justify-center">
        {imageUrl && !failed ? (
          <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-white/90 text-[28px] -rotate-[25deg]">{icon}</span>
        )}
      </span>
    </button>
  )
}
