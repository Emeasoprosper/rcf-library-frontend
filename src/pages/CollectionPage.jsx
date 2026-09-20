import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import CollectionPickerSheet from './admin/CollectionPickerSheet'
import DownloadGateModal from '../components/ui/DownloadGateModal'
import { resourceCollectionsApi, adminApi, resourcesApi } from '../services/api'
import { saveOffline, isOfflineAvailable } from '../lib/offlineStorage'
import { isRunningAsInstalledApp } from '../lib/pwaInstall'
import { useAuth } from '../contexts/AuthContext'
import { useActiveResource } from '../contexts/ActiveResourceContext'
import { extractAccentColorMixedWithBlack } from '../lib/extractAccentColor'
import { useRef } from 'react'
import { useIsDesktopViewport } from '../hooks/useIsDesktopViewport'

const TABS = ['Sections', 'About', 'More Like This']

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

function ResourceListRow({ resource, navigate, isAdmin, onRemove, onMove, onDownload, onToggleSave, onOpen }) {
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
  const [ambientColor, setAmbientColor] = useState(null)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [data, setData] = useState(null)
  const [allCollections, setAllCollections] = useState([])
  const [activeTab, setActiveTab] = useState('Sections')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [movingResource, setMovingResource] = useState(null)
  const [showGate, setShowGate] = useState(false)

  // Scroll-collapse effect for the hero artwork/title, matching a
  // Spotify-style collapsing header. Mutates styles directly via refs
  // (not React state) to avoid a re-render on every scroll tick.
  // NOTE: no TopAppBar renders on this page (see back button below), so
  // this no longer feeds HeaderAmbientContext — it only drives the
  // in-page hero fade and the sticky tabs-bar background below.
  const artworkRef = useRef(null)
  const titleRef = useRef(null)
  const metaRef = useRef(null)
  const MAX_SCROLL = 180
  const [tabsBarProgress, setTabsBarProgress] = useState(0)

  // Real extracted color from the cover art (same utility already used
  // for audio player backgrounds elsewhere) rather than a blurred copy
  // of the photo itself.
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
      const scrollY = window.scrollY
      const progress = Math.min(Math.max(scrollY / MAX_SCROLL, 0), 1)

      if (artworkRef.current) {
        const scale = 1 - progress * 0.55
        const opacity = Math.max(1 - progress * 1.4, 0)
        artworkRef.current.style.transform = `scale(${scale})`
        artworkRef.current.style.opacity = opacity
      }
      if (metaRef.current) {
        metaRef.current.style.opacity = Math.max(1 - progress * 2, 0)
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translateY(${-progress * 12}px)`
      }
      setTabsBarProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Same install-gate + offline-save flow as ResourceDetail.jsx — a
  // resource downloaded from inside a collection ends up in the exact
  // same offline library as one downloaded from its own detail page.
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
        <button
          onClick={() => navigate(-1)}
          className="fixed top-6 left-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <p className="font-body-md text-body-md text-on-surface-variant text-center mt-stack-lg pt-24">
          {error || 'Collection not found.'}
        </p>
      </div>
    )
  }

  const { collection, sections, related } = data
  const resourceCount = sections.reduce((sum, s) => sum + s.resources.length, 0)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pb-24 md:pl-80 lg:pr-80">
      <div className="relative z-0 md:pt-24 overflow-hidden">
        {/* Single back control for every viewport — TopAppBar does not
            render on this page (its collapsing bar was never wired up
            here), so this is the only back button on mobile too. */}
        <button
          onClick={() => navigate(-1)}
          className="flex absolute top-6 md:top-28 left-4 md:left-6 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur items-center justify-center text-white hover:bg-black/70 transition"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
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
          <div ref={titleRef} className="min-w-0 w-full">
            <h1 className="font-headline-md text-headline-md font-display text-on-surface leading-tight">
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
        <div className="sticky top-0 md:top-24 z-20 flex gap-6 border-b border-outline px-margin-mobile relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-background" />
          {ambientColor && (
            <div
              className="absolute inset-0 -z-10 transition-opacity duration-100"
              style={{ background: ambientColor, opacity: tabsBarProgress }}
            />
          )}
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
                      navigate={navigate}
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