import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageHeader } from '../contexts/PageHeaderContext'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import CollectionPickerSheet from './admin/CollectionPickerSheet'
import DownloadGateModal from '../components/ui/DownloadGateModal'
import { resourceCollectionsApi, adminApi, resourcesApi } from '../services/api'
import { saveOffline, isOfflineAvailable } from '../lib/offlineStorage'
import { isRunningAsInstalledApp } from '../lib/pwaInstall'
import { useAuth } from '../contexts/AuthContext'
import { useActiveResource } from '../contexts/ActiveResourceContext'
import { useHeaderAmbient } from '../contexts/HeaderAmbientContext'
import { extractAccentColorMixedWithBlack } from '../lib/extractAccentColor'
import { useIsDesktopViewport } from '../hooks/useIsDesktopViewport'

const TABS = ['Sections', 'About', 'More Like This']
// Fallback only, used until the real positions have been measured.
const MAX_SCROLL = 180
// Pixels of scrolling the nav title / nav tabs take to go from invisible to full.
const FADE_DISTANCE = 40

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
}

function targetPathFor(resource) {
  if (resource.file_type?.startsWith('audio/') || resource.file_type?.startsWith('video/')) {
    return `/resources/${resource.id}/read`
  }
  return `/library/${resource.id}`
}

function openReaderFor(resource, { isDesktop, openResource, navigate }) {
  if (isDesktop) {
    openResource(resource)
    return
  }
  navigate(targetPathFor(resource))
}

function ResourceListRow({ resource, isAdmin, onRemove, onMove, onDownload, onToggleSave, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [saved, setSaved] = useState(Boolean(resource.is_bookmarked))

  useEffect(() => {
    isOfflineAvailable(resource.id).then(setDownloaded)
  }, [resource.id])

  return (
    <div className="relative flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline mb-2">
      <button onClick={() => onOpen(resource)} className="flex items-center gap-3 flex-grow min-w-0 text-left">
        <div className="w-14 h-14 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
          {resource.thumbnail_url ? (
            <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                {resource.thumbnail_status === 'processing' ? 'hourglass_top' : (resource.type_icon || 'description')}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <p className="font-body-md text-body-md font-bold text-on-surface truncate">{resource.title}</p>
          {resource.category && (
            <p className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              <span className="material-symbols-outlined text-[14px]">{resource.type_icon || 'description'}</span>
              {resource.category.toUpperCase()}
            </p>
          )}
          <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-0.5">
            {resource.contributor_name ? `Uploaded by ${resource.contributor_name}` : 'Uploaded anonymously'}
            {resource.created_at && ` • ${timeAgo(resource.created_at)}`}
          </p>
        </div>
      </button>

      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-9 h-9 flex-none rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
        aria-label="More options"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {menuOpen && (
        <div
          className="absolute top-12 right-2 z-10 bg-surface-container-high border border-outline rounded-xl shadow-lg overflow-hidden min-w-[200px]"
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            onClick={() => { setMenuOpen(false); onOpen(resource) }}
            className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Open
          </button>
          <button
            onClick={async () => {
              setMenuOpen(false)
              await onToggleSave(resource, saved)
              setSaved((v) => !v)
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">{saved ? 'bookmark' : 'bookmark_border'}</span>
            {saved ? 'Remove from Saved' : 'Save'}
          </button>
          <button
            onClick={async () => {
              setMenuOpen(false)
              const success = await onDownload(resource)
              if (success) setDownloaded(true)
            }}
            disabled={downloaded}
            className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">{downloaded ? 'download_done' : 'download'}</span>
            {downloaded ? 'Downloaded' : 'Download'}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => { setMenuOpen(false); onMove(resource) }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                Move to another collection
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRemove(resource) }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-label-sm text-label-sm text-error hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle_outline</span>
                Remove from this collection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function toRailCollectionItem(collection, navigate) {
  return {
    id: `collection-${collection.id}`,
    title: collection.title,
    subtitle: collection.author,
    thumbnailUrl: collection.cover_url,
    fileType: undefined,
    isCollection: true,
    onClick: () => navigate(`/collections/${collection.id}`),
  }
}

function toRailResourceItem(resource, navigate) {
  return {
    id: resource.id,
    title: resource.title,
    fileType: resource.file_type,
    thumbnailUrl: resource.thumbnail_url,
    thumbnailStatus: resource.thumbnail_status,
    subtitle: resource.chapter || resource.part || resource.volume || resource.edition || null,
    onClick: () => navigate(targetPathFor(resource)),
  }
}

function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openResource } = useActiveResource()
  const isDesktop = useIsDesktopViewport()
  const { setAmbient, clearAmbient } = useHeaderAmbient()
  const [ambientColor, setAmbientColor] = useState(null)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [data, setData] = useState(null)
  const [allCollections, setAllCollections] = useState([])
  const [activeTab, setActiveTab] = useState('Sections')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [movingResource, setMovingResource] = useState(null)
  const [showGate, setShowGate] = useState(false)

  const artworkRef = useRef(null)
  const heroTitleRef = useRef(null)
  const metaRef = useRef(null)
  // TIMING: ref on the in-page tabs bar so its real position can be measured.
  const inPageTabsRef = useRef(null)
  const [tabsBarProgress, setTabsBarProgress] = useState(0)
  // TIMING: 0 -> 1 fade values for the title and tabs shown in the nav.
  const [titleFade, setTitleFade] = useState(0)
  const [tabsFade, setTabsFade] = useState(0)

  // Real on-screen positions of the moving hero title and its landing
  // spot (the real header title), measured via getBoundingClientRect —
  // not guessed pixel values — so the slide-and-scale lands exactly on
  // target regardless of screen size or font metrics. Re-measured on
  // mount and on resize; scroll itself only interpolates between them.
  const mobileHeaderTitleRef = useRef(null)
  const desktopHeaderTitleRef = useRef(null)
  // TIMING: ref on the desktop bar so its bottom edge can be measured.
  const desktopBarRef = useRef(null)
  // titleDock: scroll distance at which the hero title reaches the nav title's line.
  // tabsDock:  scroll distance at which the in-page tabs reach the nav's bottom edge.
  const titleTransformRef = useRef({ dx: 0, scale: 1, titleDock: 0, tabsDock: 0 })

  function measureTitlePositions() {
    const hero = heroTitleRef.current
    const isDesktopLayout = window.innerWidth >= 768
    const target = isDesktopLayout ? desktopHeaderTitleRef.current : mobileHeaderTitleRef.current
    const bar = isDesktopLayout ? desktopBarRef.current : mobileHeaderTitleRef.current?.closest('header')
    if (!hero || !target) return

    // Measure the hero where it naturally sits (transform off), so the
    // numbers never depend on the current scroll animation.
    const previousTransform = hero.style.transform
    hero.style.transform = 'none'
    const heroRect = hero.getBoundingClientRect()
    hero.style.transform = previousTransform
    const targetRect = target.getBoundingClientRect()
    if (heroRect.width === 0 || targetRect.width === 0) return

    const heroFont = parseFloat(getComputedStyle(hero).fontSize)
    const targetFont = parseFloat(getComputedStyle(target).fontSize)

    const titleDock =
      heroRect.top + heroRect.height / 2 + window.scrollY - (targetRect.top + targetRect.height / 2)

    let tabsDock = 0
    const tabsEl = inPageTabsRef.current
    if (tabsEl && bar) {
      tabsDock = tabsEl.getBoundingClientRect().top + window.scrollY - bar.getBoundingClientRect().bottom
    }

    titleTransformRef.current = {
      dx: targetRect.left - heroRect.left,
      scale: heroFont > 0 && targetFont > 0 ? targetFont / heroFont : 1,
      titleDock: Math.max(titleDock, 0),
      tabsDock: Math.max(tabsDock, 0),
    }
  }

  useEffect(() => {
    measureTitlePositions()
    window.addEventListener('resize', measureTitlePositions)
    document.fonts?.ready?.then(measureTitlePositions)
    return () => window.removeEventListener('resize', measureTitlePositions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.collection?.title])

  useEffect(() => {
    let cancelled = false
    setAmbientColor(null)
    if (data?.collection?.cover_url) {
      extractAccentColorMixedWithBlack(data.collection.cover_url)
        .then((gradient) => { if (!cancelled) setAmbientColor(gradient) })
        .catch(() => {})
    }
    return () => { cancelled = true }
  }, [data?.collection?.cover_url])

  useEffect(() => {
    function handleScroll() {
      const scrollY = Math.max(window.scrollY, 0)
      const { dx, scale, titleDock, tabsDock } = titleTransformRef.current

      // TIMING: progress runs against the real distance the hero title has
      // to travel to reach the nav title, not a fixed 180px.
      const progress = Math.min(Math.max(scrollY / (titleDock || MAX_SCROLL), 0), 1)

      // TIMING: nav title goes 0 -> full starting the moment the hero title
      // reaches its line; nav tabs go 0 -> full starting the moment the
      // in-page tabs reach the nav's bottom edge.
      const navTitleFade =
        titleDock > 0 ? Math.min(Math.max((scrollY - titleDock) / FADE_DISTANCE, 0), 1) : 0
      const navTabsFade =
        tabsDock > 0 ? Math.min(Math.max((scrollY - tabsDock) / FADE_DISTANCE, 0), 1) : 0

      if (artworkRef.current) {
        artworkRef.current.style.transform = `scale(${1 - progress * 0.55})`
      }
      if (metaRef.current) {
        metaRef.current.style.opacity = Math.max(1 - progress * 2, 0)
      }
      if (heroTitleRef.current) {
        // TIMING: vertical movement is the page scroll itself. Only the
        // sideways slide and the shrink are interpolated. Once it reaches
        // the nav title's line it is held there (hold) while it fades out
        // and the nav title fades in, so it looks like it just stayed.
        const hold = titleDock > 0 ? Math.max(scrollY - titleDock, 0) : 0
        heroTitleRef.current.style.transformOrigin = 'left center'
        heroTitleRef.current.style.transform = `translate(${dx * progress}px, ${hold}px) scale(${1 - (1 - scale) * progress})`
        heroTitleRef.current.style.opacity = 1 - navTitleFade
      }
      if (inPageTabsRef.current) {
        // TIMING: the in-page tabs fade out exactly as the nav tabs fade in.
        inPageTabsRef.current.style.opacity = 1 - navTabsFade
        inPageTabsRef.current.style.pointerEvents = navTabsFade > 0.5 ? 'none' : 'auto'
      }
      setTabsBarProgress(progress)
      setTitleFade(navTitleFade)
      setTabsFade(navTabsFade)
      setAmbient({ progress, color: ambientColor, titleOpacity: navTitleFade, tabsOpacity: navTabsFade })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearAmbient()
    }
  }, [ambientColor, setAmbient, clearAmbient])

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      resourceCollectionsApi.get(id),
      resourceCollectionsApi.list().catch(() => ({ items: [] })),
    ])
      .then(([detail, listRes]) => {
        setData(detail)
        setAllCollections((listRes.items || []).filter((c) => c.id !== id))
      })
      .catch((err) => setError(err.message || 'Failed to load collection'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setActiveTab('Sections')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRemove = async (resource) => {
    await adminApi.removeFromCollection(resource.id)
    load()
  }

  const handleMoved = async (collectionId) => {
    const resource = movingResource
    setMovingResource(null)
    await adminApi.organizeResource(resource.id, { collectionId })
    load()
  }

  const handleToggleSave = async (resource, currentlySaved) => {
    if (currentlySaved) {
      await resourcesApi.unbookmark(resource.id).catch(() => {})
    } else {
      await resourcesApi.bookmark(resource.id).catch(() => {})
    }
  }

  const handleDownload = async (resource) => {
    if (!isRunningAsInstalledApp()) {
      setShowGate(true)
      return false
    }
    try {
      await resourcesApi.download(resource.id)
      const { blob, mimeType } = await resourcesApi.downloadFileForOffline(resource.id)
      await saveOffline(resource.id, blob, mimeType, {
        title: resource.title,
        thumbnailUrl: resourcesApi.thumbnailUrl(resource.id),
      })
      return true
    } catch {
      alert('Download failed — please try again.')
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-outline border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <TopAppBar title="Collection" showBack />
        <p className="font-body-md text-body-md text-on-surface-variant text-center pt-24">
          {error || 'Collection not found.'}
        </p>
      </div>
    )
  }

  const { collection, sections, related } = data
  const resourceCount = sections.reduce((sum, s) => sum + s.resources.length, 0)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pb-24 md:pl-80 lg:pr-80">
      <TopAppBar
        title={collection.title}
        showBack
        onBack={() => navigate(-1)}
        titleRef={mobileHeaderTitleRef}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Desktop-only page title bar, confined to the center column
          (md:left-80 lg:right-80 matches the outer div's own offsets) —
          never touches the global search/nav header above it. Docks
          the same tabs row under its title, both fading in together. */}
      <div
        ref={desktopBarRef}
        className="hidden md:flex flex-col fixed top-[72px] left-0 md:left-80 right-0 lg:right-80 z-30 px-6 pt-3 pb-1 isolate"
        style={{ pointerEvents: tabsBarProgress > 0.05 ? 'auto' : 'none' }}
      >
        {/* Background layer: the only part that is completely invisible
            while the artwork is at full size; it fades in with the blur
            as the artwork shrinks. The back arrow sits outside it, so
            it is always visible. */}
        <div
          className="absolute inset-0 -z-10 border-b border-outline"
          style={{
            background: ambientColor || undefined,
            opacity: tabsBarProgress,
            backdropFilter: `blur(${tabsBarProgress * 16}px)`,
            WebkitBackdropFilter: `blur(${tabsBarProgress * 16}px)`,
          }}
        />
        <div className="flex items-center gap-3 h-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 flex-none pointer-events-auto"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2
            ref={desktopHeaderTitleRef}
            className="font-headline-md text-headline-md font-bold text-on-surface truncate"
            style={{ opacity: titleFade }}
          >
            {collection.title}
          </h2>
        </div>
        <div
          className="flex gap-6 pb-2"
          style={{ opacity: tabsFade, pointerEvents: tabsFade > 0.5 ? 'auto' : 'none' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 font-label-md text-label-md relative ${
                activeTab === tab ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-on-surface rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-0 overflow-hidden pt-[68px] md:pt-24 md:pt-24">
        {ambientColor && (
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0" style={{ background: ambientColor }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          </div>
        )}

        <section className="px-margin-mobile pt-stack-lg pb-stack-md flex flex-col items-center text-center">
          <div
            ref={artworkRef}
            className="w-40 h-40 md:w-48 md:h-48 flex-none rounded-xl overflow-hidden bg-surface-container-high border border-outline shadow-2xl mb-stack-md origin-top"
          >
            {collection.cover_url ? (
              <img src={collection.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">library_books</span>
              </div>
            )}
          </div>
          <div className="min-w-0 w-full">
            <h1
              ref={heroTitleRef}
              className="font-headline-md text-headline-md font-display text-on-surface leading-tight inline-block"
            >
              {collection.title}
            </h1>
            {collection.author && (
              <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">{collection.author}</p>
            )}
          </div>
          <p ref={metaRef} className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">
            {resourceCount} resource{resourceCount !== 1 ? 's' : ''}
          </p>
        </section>
      </div>

      <main>
        {/* Not sticky — scrolls normally with the page and passes behind
            the fixed header above it. As it reaches the header's bottom
            edge it fades out while the header's own tabs row fades in
            (see handleScroll), so only one of them is ever visible. */}
        <div ref={inPageTabsRef} className="flex gap-6 border-b border-outline px-margin-mobile">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 pt-1 font-label-md text-label-md relative ${
                activeTab === tab ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === 'Sections' && (
          <div className="px-margin-mobile pt-stack-md">
            {sections.map((section) =>
              section.resources.length === 0 ? null : (
                <div key={section.id || 'unsectioned'} className="mb-stack-lg">
                  <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-stack-sm">
                    {section.name}
                  </h3>
                  {section.resources.map((r) => (
                    <ResourceListRow
                      key={r.id}
                      resource={r}
                      isAdmin={isAdmin}
                      onRemove={handleRemove}
                      onMove={setMovingResource}
                      onDownload={handleDownload}
                      onToggleSave={handleToggleSave}
                      onOpen={(resource) => openReaderFor(resource, { isDesktop, openResource, navigate })}
                    />
                  ))}
                </div>
              )
            )}
            {sections.every((s) => s.resources.length === 0) && (
              <p className="font-label-sm text-label-sm text-on-surface-variant italic">
                No resources in this collection yet.
              </p>
            )}
            {related.length > 0 && (
              <div className="-mx-margin-mobile mt-stack-lg">
                <HorizontalRail
                  title="Related Resources"
                  items={related.map((r) => toRailResourceItem(r, navigate))}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'About' && (
          <div className="px-margin-mobile py-stack-sm">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {collection.description || 'No description available for this collection yet.'}
            </p>
          </div>
        )}

        {activeTab === 'More Like This' && (
          <div className="px-margin-mobile py-stack-sm">
            {allCollections.length > 0 ? (
              <HorizontalRail
                title="More Collections"
                items={allCollections.map((c) => toRailCollectionItem(c, navigate))}
              />
            ) : (
              <p className="font-label-sm text-label-sm text-on-surface-variant">No other collections yet.</p>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      <CollectionPickerSheet
        open={!!movingResource}
        resource={movingResource}
        collections={allCollections}
        onClose={() => setMovingResource(null)}
        onPicked={handleMoved}
        onCreated={(c) => setAllCollections((prev) => [c, ...prev])}
      />

      <DownloadGateModal open={showGate} onClose={() => setShowGate(false)} />
    </div>
  )
}

export default CollectionPage