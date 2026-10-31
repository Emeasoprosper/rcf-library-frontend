import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import ResourceCard from '../components/resource/ResourceCard'
import { resourcesApi, analyticsApi, externalApi } from '../services/api'
import AudiobookPlayer from '../components/ui/AudiobookPlayer'
import { getMediaKind, MEDIA_KIND_STYLE } from '../lib/mediaKind'
import { useAuth } from '../contexts/AuthContext'
import { GettingStarted, BrowseTile, BROWSE_COLORS } from '../components/search/SearchDiscover'

// Canonical resource URL — see AppRoutes.jsx (<Route path="/library/:id" />)
const resourceDetailPath = (id) => `/library/${id}`

const RECENTS_KEY = 'recentSearches'
const RECENTS_VERSION = 3 // bumped: v2 could save entries with lost thumbnails

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

// Cover from archive.org's own thumbnail service. If it can't load (slow campus
// network, no cover), a book icon is shown instead so the card never looks broken.
function ExternalCover({ identifier, icon = 'menu_book' }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-20 h-28 flex-none rounded-lg bg-surface-container-high border border-outline shadow-md overflow-hidden flex items-center justify-center">
      {failed ? (
        <span className="material-symbols-outlined text-on-surface-variant text-[32px]">{icon}</span>
      ) : (
        <img
          src={`https://archive.org/services/img/${encodeURIComponent(identifier)}`}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// "Public domain (published 1900)" -> "Public domain"; CC URLs -> "CC BY-SA", etc.
function shortLicence(label = '') {
  if (/public domain|cc0/i.test(label)) return 'Public domain'
  const m = /licenses\/([a-z-]+)\//i.exec(label)
  if (m) return `CC ${m[1].toUpperCase()}`
  return label || 'Open licence'
}

function InfoStat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="font-label-md text-label-md font-semibold text-on-surface truncate">{value}</span>
    </div>
  )
}

// One open textbook (Open Textbook Library). "Add & read" copies it into the
// library so it opens in the app's own reader; nothing opens outside the app.
function TextbookCard({ item, state, onGet }) {
  const working = state?.state === 'working'
  return (
    <article className="rcf-lift rounded-2xl bg-surface-container border border-outline p-4 flex gap-4">
      <div className="w-16 h-20 flex-none rounded-xl bg-gradient-to-br from-[#5b7cfa] to-[#7c5cf5] flex flex-col items-center justify-center text-white shadow-md">
        <span className="material-symbols-outlined text-[26px]">school</span>
        {item.year && <span className="text-[11px] font-bold mt-0.5">{item.year}</span>}
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5b7cfa]/15 text-[#5b7cfa] text-[11px] font-semibold uppercase tracking-wide">
            Textbook
          </span>
          {item.subjects?.[0] && <span className="text-[11px] text-on-surface-variant truncate">{item.subjects[0]}</span>}
          {item.rating ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-500">
              <span className="material-symbols-outlined text-[13px]">star</span>{item.rating}
            </span>
          ) : null}
        </div>
        <h3 className="font-body-md text-body-md font-semibold text-on-surface leading-snug line-clamp-2">{item.title}</h3>
        {item.author && <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-1">{item.author}</p>}
        {item.description && <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2">{item.description}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            type="button"
            onClick={onGet}
            disabled={working}
            className="rcf-press inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${working ? 'animate-spin' : ''}`}>
              {working ? 'progress_activity' : 'auto_stories'}
            </span>
            {working ? 'Adding to library…' : 'Add & read in app'}
          </button>
          <span className="text-[11px] text-on-surface-variant">
            PDF{item.sizeMB ? ` · ${item.sizeMB} MB` : ''} · {item.licence}
          </span>
        </div>
        {state?.state === 'error' && <ImportProblem message={state.message} title={item.title} onRetry={onGet} />}
      </div>
    </article>
  )
}

// Raw API errors ("Request failed (404)") mean nothing to a student and make
// the app look broken. Turn them into a calm sentence.
function friendlyImportError(err) {
  const msg = String(err?.message || '')
  if (!navigator.onLine) return "You're offline. Connect to the internet and try again."
  if (/session expired/i.test(msg)) return msg
  if (/^Request failed \((404|5\d\d)\)|failed to fetch|network/i.test(msg)) {
    return "We couldn't add this book right now. Our library server may be updating. Please try again in a few minutes, or request it and we'll add it for you."
  }
  return msg || "We couldn't add this book right now. Please try again."
}

// Shown under a free book that couldn't be added: what happened, and what to do next.
function ImportProblem({ message, title, onRetry }) {
  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5">
      <span className="material-symbols-outlined text-amber-500 text-[20px] flex-none">info</span>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-label-sm text-on-surface">{message}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={onRetry}
            className="rcf-press inline-flex items-center gap-1 h-8 px-3 rounded-full bg-surface-container-high border border-outline font-label-sm text-label-sm text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>Try again
          </button>
          <Link
            to="/contribute/request"
            state={{ prefillTitle: title }}
            className="rcf-press inline-flex items-center gap-1 h-8 px-3 rounded-full font-label-sm text-label-sm text-primary hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>Request this book
          </Link>
        </div>
      </div>
    </div>
  )
}

// One open-access result: cover, type badge, key facts, licence, preview link,
// and either "Get this book" (import) or, for audiobooks, "Listen now".
function ExternalBookCard({ item, state, onGet, onListen }) {
  const isAudio = item.kind === 'audio'
  const working = state?.state === 'working'
  const size = item.sizeMB ?? item.approxMB
  const sizeLabel = size ? `${item.sizeMB ? '' : '~'}${size} MB` : '—'
  const isLarge = Number(size) >= 20

  const stats = isAudio
    ? [
        { label: 'Format', value: 'Audio · Listen' },
        { label: 'Length', value: item.totalTime || '—' },
        { label: 'Size', value: sizeLabel },
      ]
    : [
        { label: 'Format', value: 'PDF · Read' },
        { label: 'Size', value: sizeLabel },
        { label: 'Published', value: item.year || '—' },
      ]

  return (
    <article className="rounded-2xl bg-surface-container border border-outline overflow-hidden">
      <div className="flex gap-4 p-4">
        <ExternalCover identifier={item.identifier} icon={isAudio ? 'headphones' : 'menu_book'} />
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide">
            <span className="material-symbols-outlined text-[13px]">{isAudio ? 'headphones' : 'picture_as_pdf'}</span>
            {isAudio ? 'Audiobook' : 'Book'}
          </span>
          <h3 className="font-body-md text-body-md font-semibold text-on-surface leading-snug line-clamp-3">
            {item.title}
          </h3>
          {item.author && (
            <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-1">{item.author}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-y border-outline bg-surface-container-low">
        {stats.map((s) => (
          <InfoStat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[16px]">public</span>
          {shortLicence(item.licence)}
        </span>
        <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">{isAudio ? 'headphones' : 'chrome_reader_mode'}</span>
          {isAudio ? 'Plays in the app' : 'Opens in the app reader'}
        </span>
      </div>

      {isLarge && !working && (
        <p className="px-4 pt-2 flex items-center gap-1 font-label-sm text-label-sm text-amber-400">
          <span className="material-symbols-outlined text-[14px]">wifi</span>
          Large file. Reading it uses about {size} MB of data.
        </p>
      )}

      {state?.state === 'error' && (
        <div className="mx-4">
          <ImportProblem message={state.message} title={item.title} onRetry={onGet} />
        </div>
      )}

      <div className="p-4">
        {isAudio ? (
          <button
            onClick={onListen}
            className="rcf-press w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-[#5b7cfa] to-[#d946ef] text-white font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            Listen now · {item.chapters} chapters
          </button>
        ) : (
        <button
          onClick={onGet}
          disabled={working}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${working ? 'animate-spin' : ''}`}>
            {working ? 'progress_activity' : 'add_circle'}
          </span>
          {working ? 'Adding to library… about 20 seconds' : 'Get this book'}
        </button>
        )}
      </div>
    </article>
  )
}

function Search() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
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

  // Open-access fallback (Internet Archive). extResults === null means "not searched yet".
  const [extResults, setExtResults] = useState(null)
  const [extSearching, setExtSearching] = useState(false)
  const [extError, setExtError] = useState(null)
  const [importing, setImporting] = useState({})
  const [extTextbooks, setExtTextbooks] = useState([])
  const [extAudio, setExtAudio] = useState([])
  const [listening, setListening] = useState(null) // audiobook item being played

  useEffect(() => {
    setRecents(loadRecents())
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery((prev) => (prev === q ? prev : q))
  }, [searchParams])

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
      thumbnailUrl: resource.thumbnail_url ?? resource.thumbnailUrl,
      thumbnailStatus: resource.thumbnail_status ?? resource.thumbnailStatus,
      fileType: resource.file_type ?? resource.fileType,
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

  useEffect(() => {
    setExtResults(null)
    setExtTextbooks([])
    setExtAudio([])
    setExtError(null)
  }, [query])

  // Three free sources at once: newest open textbooks first, then
  // public-domain books, then audiobooks you can play right here.
  const searchOpenBooks = async () => {
    const q = query.trim()
    if (q.length < 3) return
    setExtSearching(true)
    setExtError(null)
    const [textbooks, books, audio] = await Promise.allSettled([
      externalApi.textbooks(q),
      externalApi.search(q),
      externalApi.audiobooks(q),
    ])
    const items = (r) => (r.status === 'fulfilled' ? r.value.items || [] : [])
    setExtTextbooks(items(textbooks))
    setExtResults(items(books))
    setExtAudio(items(audio).map((a) => ({ ...a, kind: 'audio' })))
    if ([textbooks, books, audio].every((r) => r.status === 'rejected')) {
      setExtError('Could not search free books right now. Please try again.')
    }
    setExtSearching(false)
  }

  // key = card id for the spinner; start = asks the backend to copy the book
  // into the library. Ends by opening it in the app's own reader page.
  const getExternalBook = async (item, { key = item.identifier, start: startFn = () => externalApi.startImport(item.identifier) } = {}) => {
    if (!isAuthenticated) {
      navigate('/signin', { state: { from: '/search' } })
      return
    }
    setImporting((prev) => ({ ...prev, [key]: { state: 'working' } }))
    try {
      const start = await startFn()
      if (start.alreadyInLibrary) {
        navigate(resourceDetailPath(start.resourceId))
        return
      }
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 4000))
        const job = await externalApi.importStatus(start.jobId)
        if (job.state === 'done') {
          navigate(resourceDetailPath(job.resourceId))
          return
        }
        if (job.state === 'failed') {
          throw new Error('We could not add this book. Please try another one or request it.')
        }
      }
      throw new Error('This is taking too long. Please try again in a minute.')
    } catch (err) {
      setImporting((prev) => ({ ...prev, [key]: { state: 'error', message: friendlyImportError(err) } }))
    }
  }

  const showIdleContent = query.trim().length < MIN_SEARCH_LENGTH
  const showHistoryDropdown = historyOpen && query.trim().length === 0 && recents.length > 0


  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-80 lg:pr-80">
      <TopAppBar title="Search" />

      <main className="pb-24 pt-[68px] md:pt-24 px-margin-mobile md:pt-24 md:pb-12">
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
              <div className="mb-stack-sm p-stack-md rounded-xl bg-surface-container border border-outline flex flex-col items-center text-center">
                <img src="/searchNotFound.png" alt="" className="w-36 h-36 object-contain mb-stack-md" />
                <p className="font-label-md text-label-md text-on-surface-variant mb-stack-sm">
                  No results for "{query.trim()}".
                </p>
                <button
                  onClick={() => navigate('/contribute/request', { state: { prefillTitle: query.trim() } })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Request this material
                </button>
              </div>
            )}

            {!searching && !searchError && hasSearched && query.trim().length >= 3 && (
              <section className="mb-stack-lg">
                {extResults === null && (
                  <button
                    onClick={searchOpenBooks}
                    disabled={extSearching}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-outline bg-surface-container text-on-surface font-label-md text-label-md disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${extSearching ? 'animate-spin' : ''}`}>
                      {extSearching ? 'progress_activity' : 'travel_explore'}
                    </span>
                    {extSearching ? 'Searching free books, textbooks and audiobooks…' : 'Search free textbooks, books & audiobooks online'}
                  </button>
                )}

                {extError && (
                  <p className="font-label-md text-label-md text-red-400 mt-stack-sm">{extError}</p>
                )}

                {extResults !== null && !extError && extResults.length === 0 && extTextbooks.length === 0 && extAudio.length === 0 && (
                  <p className="font-label-md text-label-md text-on-surface-variant text-center">
                    No free books found for "{query.trim()}". You can still request it.
                  </p>
                )}

                {extTextbooks.length > 0 && (
                  <div className="mb-stack-lg">
                    <h2 className="font-headline-md text-headline-md font-display text-on-surface mb-1">
                      Newest free textbooks
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm">
                      Peer-reviewed university textbooks, free and legal. Latest editions first. Tap one to add it to the library and read it here.
                    </p>
                    <div className="flex flex-col gap-3">
                      {extTextbooks.map((t) => (
                        <TextbookCard
                          key={t.id}
                          item={t}
                          state={importing[`otl-${t.id}`]}
                          onGet={() => getExternalBook(t, { key: `otl-${t.id}`, start: () => externalApi.startTextbookImport(t.id) })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {extAudio.length > 0 && (
                  <div className="mb-stack-lg">
                    <h2 className="font-headline-md text-headline-md font-display text-on-surface mb-1">
                      Free audiobooks
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm">
                      Public-domain classics read by LibriVox volunteers. Tap Listen now to play here.
                    </p>
                    <div className="flex flex-col gap-4">
                      {extAudio.map((item) => (
                        <ExternalBookCard key={item.librivoxId} item={item} onListen={() => setListening(item)} />
                      ))}
                    </div>
                  </div>
                )}

                {extResults !== null && extResults.length > 0 && (
                  <>
                    <h2 className="font-headline-md text-headline-md font-display text-on-surface mb-1">
                      Free open-access books
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm">
                      Open licences listed by the Internet Archive. Tap Preview to look first, then add the ones you want.
                    </p>
                    <div className="flex flex-col gap-4">
                      {extResults.map((item) => (
                        <ExternalBookCard
                          key={item.identifier}
                          item={item}
                          state={importing[item.identifier]}
                          onGet={() => getExternalBook(item)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-gutter">
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
            <div className="mb-stack-lg">
              <GettingStarted onOpen={openResource} />
            </div>

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
              <h2 className="text-[22px] md:text-[24px] font-bold text-on-surface leading-tight mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Browse the shelves
              </h2>
              {realCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {realCategories.map((cat, i) => (
                    <BrowseTile
                      key={cat.id}
                      title={cat.name}
                      color={BROWSE_COLORS[i % BROWSE_COLORS.length]}
                      onClick={() => navigate(`/shelf?category=${encodeURIComponent(cat.name)}`)}
                      imageUrl={categorySamples[cat.name]?.thumbnail_url}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-stack-lg">
                  <img src="/NoCategoryWithResourceYet.png" alt="" className="w-36 h-36 object-contain mb-stack-md" />
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    No categories with resources yet.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {listening && <AudiobookPlayer item={listening} onClose={() => setListening(null)} />}

      <BottomNav />
    </div>
  )
}

export default Search
