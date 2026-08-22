import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import ResourceCard from '../components/resource/ResourceCard'
import { resourcesApi, analyticsApi } from '../services/api'
import { getMediaKind, MEDIA_KIND_STYLE } from '../lib/mediaKind'
import { extractAccentGradient } from '../lib/extractAccentColor'
import { useAuth } from '../contexts/AuthContext'

// Cycled by index across however many real categories come back from
// /resources/meta/categories — that endpoint already only returns
// categories with at least one approved resource, so every tile
// rendered below is guaranteed non-empty. No more hardcoded 4-item
// list disconnected from the real categories table.
const CATEGORY_GRADIENTS = [
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-fuchsia-400',
  'from-rose-500 to-pink-400',
  'from-sky-500 to-blue-400',
  'from-lime-500 to-green-400',
  'from-fuchsia-500 to-purple-400',
  'from-cyan-500 to-teal-400',
]

// Canonical resource URL — see AppRoutes.jsx (<Route path="/library/:id" />)
const resourceDetailPath = (id) => `/library/${id}`

const RECENTS_KEY = 'recentSearches'
const RECENTS_VERSION = 2 // bumped: old entries were {term, category} text-only

// Debounce delay for live search-as-you-type, and the minimum characters
// before we bother hitting the backend at all. 1 (not 2) since the
// backend now does prefix + trigram matching — a single letter like "c"
// is meant to surface anything starting with c.
const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 1

// Converts a raw API resource row (snake_case, as returned by
// resources.js / analytics.js) into the shape HorizontalRail /
// ResourceCard expect (camelCase), and attaches an onClick that both
// navigates to the resource and records it in Recent Searches.
function toCardProps(resource, openResource) {
  return {
    id: resource.id,
    title: resource.title,
    subtitle: resource.author || resource.category || '',
    author: resource.author,
    thumbnailUrl: resource.thumbnail_url,
    thumbnailStatus: resource.thumbnail_status,
    fileType: resource.file_type,
    onClick: () => openResource(resource),
  }
}

function loadRecents() {
  try {
    const stored = localStorage.getItem(RECENTS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (parsed.version !== RECENTS_VERSION || !Array.isArray(parsed.items)) return []
    return parsed.items
  } catch {
    return []
  }
}

function saveRecents(items) {
  localStorage.setItem(RECENTS_KEY, JSON.stringify({ version: RECENTS_VERSION, items }))
}

// Small thumbnail used in the Recent Searches dropdown row — real
// thumbnail if we have one, otherwise an icon based on file type, sized
// for a compact list row.
function RecentThumb({ fileType, thumbnailUrl, thumbnailStatus }) {
  const kind = getMediaKind(fileType)
  const style = MEDIA_KIND_STYLE[kind]

  return (
    <div className="w-14 h-14 flex-none rounded-lg bg-surface-container-high border border-outline overflow-hidden flex items-center justify-center">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
          {thumbnailStatus === 'processing' ? 'hourglass_top' : style.gridIcon}
        </span>
      )}
    </div>
  )
}

// Spotify's "Browse all" pattern: bold title pinned top-left, tilted
// accent card peeking off the bottom-right corner (original size — w-20
// h-20, 20deg tilt). When a real thumbnail exists, the background is no
// longer the fixed per-category `gradient` prop — it's computed from
// that thumbnail's own dominant color (see extractAccentColor.js), so a
// red cover sits on a background that actually suits red instead of a
// clashing fixed hue. Falls back to the static `gradient` prop when
// there's no image, or if color sampling fails (e.g. CORS).
function SpotifyTile({ title, icon, gradient, onClick, height = 'h-32', imageUrl }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [accentGradient, setAccentGradient] = useState(null)
  const showImage = Boolean(imageUrl) && !imgFailed

  useEffect(() => {
    let cancelled = false
    setAccentGradient(null)
    if (imageUrl) {
      extractAccentGradient(imageUrl).then((grad) => {
        if (!cancelled) setAccentGradient(grad)
      })
    }
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  const usingAccent = Boolean(accentGradient)

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl ${height} p-4 text-left shadow-lg active:scale-[0.98] transition-transform ${
        usingAccent ? '' : `bg-gradient-to-br ${gradient}`
      }`}
      style={usingAccent ? { background: accentGradient } : undefined}
    >
      <h3 className="relative z-10 font-display font-bold text-white text-lg leading-tight whitespace-pre-line">
        {title}
      </h3>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rotate-[20deg] rounded-lg bg-black/30 shadow-xl border border-white/10 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover -rotate-[20deg] scale-125"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="material-symbols-outlined text-white/90 text-[32px] -rotate-[20deg]">
            {icon}
          </span>
        )}
      </div>
    </button>
  )
}

function Search() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState([])

  const [historyOpen, setHistoryOpen] = useState(false)
  const searchBarRef = useRef(null)

  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [forYou, setForYou] = useState([])
  const [popular, setPopular] = useState([])
  const [realCategories, setRealCategories] = useState([])
  const [categorySamples, setCategorySamples] = useState({})
  const [liveSessionSample, setLiveSessionSample] = useState(null)

  useEffect(() => {
    setRecents(loadRecents())
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setHistoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setForYou([])
      return
    }
    analyticsApi
      .recommended({ limit: 10 })
      .then((data) => setForYou(Array.isArray(data) ? data : []))
      .catch(() => setForYou([]))
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    analyticsApi
      .frequentlyViewed({ window: '7d', limit: 10 })
      .then((data) => setPopular(Array.isArray(data) ? data : []))
      .catch(() => setPopular([]))

    resourcesApi
      .list({ type: 'collection', pageSize: 1, sort: 'recent' })
      .then((data) => setLiveSessionSample(data.items?.[0] || null))
      .catch(() => setLiveSessionSample(null))

    // Real categories only — resourcesApi.categories() hits
    // /resources/meta/categories, which already filters to categories
    // that have at least one approved resource. This is what fixes the
    // "click a tile, land on an empty screen" bug: a tile can only exist
    // here if it has something behind it.
    resourcesApi
      .categories()
      .then((data) => setRealCategories(data.items || []))
      .catch(() => setRealCategories([]))
  }, [])

  // Fetches one sample thumbnail per real category, once the category
  // list itself has loaded. Filters by `category` (the real categories.name
  // column via resources.js's `category` query param) — NOT `type`, which
  // is resource_type (book/audio/video/etc), a completely different axis.
  useEffect(() => {
    if (realCategories.length === 0) return
    realCategories.forEach((cat) => {
      resourcesApi
        .list({ category: cat.name, pageSize: 1, sort: 'recent' })
        .then((data) => {
          const sample = data.items?.[0] || null
          setCategorySamples((prev) => ({ ...prev, [cat.name]: sample }))
        })
        .catch(() => {
          setCategorySamples((prev) => ({ ...prev, [cat.name]: null }))
        })
    })
  }, [realCategories])

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setSearchError(null)
      setSearching(false)
      setHasSearched(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)
    setSearchError(null)

    const timeout = setTimeout(async () => {
      try {
        const data = await resourcesApi.list({ search: trimmed, pageSize: 20 }, { signal: controller.signal })
        setResults(data.items || [])
        setHasSearched(true)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSearchError(err.message || 'Search failed')
          setResults([])
        }
      } finally {
        setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  const addRecent = (resource) => {
    const stub = {
      id: resource.id,
      title: resource.title,
      thumbnailUrl: resource.thumbnail_url,
      thumbnailStatus: resource.thumbnail_status,
      fileType: resource.file_type,
    }
    const next = [stub, ...recents.filter((r) => r.id !== stub.id)].slice(0, 10)
    setRecents(next)
    saveRecents(next)
  }

  const removeRecent = (id) => {
    const next = recents.filter((r) => r.id !== id)
    setRecents(next)
    saveRecents(next)
  }

  const openResource = (resource) => {
    addRecent(resource)
    setHistoryOpen(false)
    navigate(resourceDetailPath(resource.id))
  }

  const showIdleContent = query.trim().length < MIN_SEARCH_LENGTH
  const showHistoryDropdown = historyOpen && query.trim().length === 0 && recents.length > 0

  const madeForYouSample = forYou[0] || popular[0] || null
  const liveSessionImage = liveSessionSample?.thumbnail_url
  const madeForYouImage = madeForYouSample?.thumbnail_url

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Search" />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <div ref={searchBarRef} className="relative mt-stack-md mb-stack-lg">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setHistoryOpen(true)}
            autoFocus
            placeholder="Search the archives..."
            className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
          />

          {showHistoryDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 bg-surface-container-low border border-outline rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <h2 className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                  Recent Searches
                </h2>
              </div>
              <div className="flex flex-col gap-1 p-2 max-h-80 overflow-y-auto">
                {recents.map((recent) => {
                  const kind = getMediaKind(recent.fileType)
                  const kindLabel = kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : 'Resource'

                  return (
                    <div
                      key={recent.id}
                      className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-surface-container-high transition-colors group"
                    >
                      <button
                        onClick={() => openResource(recent)}
                        className="flex items-center gap-3 flex-grow text-left min-w-0"
                      >
                        <RecentThumb
                          fileType={recent.fileType}
                          thumbnailUrl={recent.thumbnailUrl}
                          thumbnailStatus={recent.thumbnailStatus}
                        />
                        <div className="min-w-0">
                          <p className="font-body-md text-body-md font-semibold text-on-surface truncate">
                            {recent.title}
                          </p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {kindLabel}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => removeRecent(recent.id)}
                        className="p-1 rounded-full hover:bg-surface-container-highest transition-colors flex-none"
                        aria-label="Remove from recent searches"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                          close
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {!showIdleContent && (
          <section>
            {searching && (
              <p className="font-label-md text-label-md text-on-surface-variant mb-stack-sm">Searching…</p>
            )}

            {!searching && searchError && (
              <p className="font-label-md text-label-md text-red-400 mb-stack-sm">{searchError}</p>
            )}

            {!searching && !searchError && hasSearched && results.length === 0 && (
              <p className="font-label-md text-label-md text-on-surface-variant mb-stack-sm">
                No results for "{query.trim()}".
              </p>
            )}

            <div className="flex flex-col gap-stack-sm">
              {results.map((resource) => {
                const props = toCardProps(resource, openResource)
                const tags = []
                if (resource.category) tags.push({ icon: 'label', label: resource.category })
                if (resource.level) tags.push({ icon: 'school', label: resource.level })
                if (resource.semester) tags.push({ icon: 'event', label: `Semester ${resource.semester}` })

                return (
                  <ResourceCard
                    key={resource.id}
                    title={props.title}
                    meta={props.subtitle}
                    tags={tags}
                    thumbnailUrl={props.thumbnailUrl}
                    thumbnailStatus={props.thumbnailStatus}
                    fileType={props.fileType}
                    onClick={props.onClick}
                  />
                )
              })}
            </div>
          </section>
        )}

        {showIdleContent && (
          <>
            {(liveSessionImage || madeForYouImage) && (
              <section className="mb-stack-lg">
                <div className="grid grid-cols-2 gap-gutter">
                  {liveSessionImage && (
                    <SpotifyTile
                      title={'Live\nSessions'}
                      icon="mic"
                      gradient="from-indigo-600 to-purple-700"
                      onClick={() => navigate('/shelf?category=collection')}
                      imageUrl={liveSessionImage}
                    />
                  )}
                  {madeForYouImage && (
                    <SpotifyTile
                      title={'Made\nFor You'}
                      icon="auto_stories"
                      gradient="from-teal-500 to-cyan-700"
                      onClick={() => navigate('/shelf?category=book')}
                      imageUrl={madeForYouImage}
                    />
                  )}
                </div>
              </section>
            )}

            {forYou.length > 0 && (
              <HorizontalRail
                title="For You"
                items={forYou.map((r) => toCardProps(r, openResource))}
              />
            )}

            {popular.length > 0 && (
              <HorizontalRail
                title="Popular"
                items={popular.map((r) => toCardProps(r, openResource))}
              />
            )}

            <section>
              <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
                Browse Categories
              </h2>
              {realCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-gutter">
                  {realCategories.map((cat, i) => (
                    <SpotifyTile
                      key={cat.id}
                      title={cat.name}
                      icon="category"
                      gradient={CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}
                      height="h-28"
                      onClick={() => navigate(`/shelf?category=${encodeURIComponent(cat.name)}`)}
                      imageUrl={categorySamples[cat.name]?.thumbnail_url}
                    />
                  ))}
                </div>
              ) : (
                <p className="font-label-md text-label-md text-on-surface-variant">
                  No categories with resources yet.
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default Search