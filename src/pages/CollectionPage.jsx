import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import HorizontalRail from '../components/resource/HorizontalRail'
import { resourceCollectionsApi } from '../services/api'
import { mixInCollections } from '../lib/mixInCollections'

const TABS = ['Sections', 'About', 'More Like This']

// document -> the resource's own detail/read page; audio/video -> the
// dedicated player route. This is the actual fix for the earlier bug:
// getMediaKind() never returns 'book', only 'document' — checking for
// 'book' meant every real book silently fell through to the wrong path.
function targetPathFor(resource) {
  if (resource.file_type?.startsWith('audio/') || resource.file_type?.startsWith('video/')) {
    return `/resources/${resource.id}/read`
  }
  return `/library/${resource.id}`
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

function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [allCollections, setAllCollections] = useState([])
  const [activeTab, setActiveTab] = useState('Sections')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setActiveTab('Sections')

    Promise.all([
      resourceCollectionsApi.get(id),
      resourceCollectionsApi.list().catch(() => ({ items: [] })),
    ])
      .then(([detail, listRes]) => {
        if (cancelled) return
        setData(detail)
        setAllCollections((listRes.items || []).filter((c) => c.id !== id))
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load collection') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

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
        <TopAppBar title="Collection" showBack onBack={() => navigate(-1)} />
        <p className="font-body-md text-body-md text-on-surface-variant text-center mt-stack-lg pt-[68px]">
          {error || 'Collection not found.'}
        </p>
      </div>
    )
  }

  const { collection, sections, related } = data
  const resourceCount = sections.reduce((sum, s) => sum + s.resources.length, 0)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pb-24">
      <TopAppBar title={collection.title} showBack onBack={() => navigate(-1)} />

      <main className="pt-[68px]">
        <section className="px-margin-mobile pt-stack-md pb-stack-md flex gap-4 items-end">
          <div className="w-28 h-28 flex-none rounded-xl overflow-hidden bg-surface-container-high border border-outline shadow-lg">
            {collection.cover_url ? (
              <img src={collection.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">library_books</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-headline-md text-headline-md font-display text-on-surface leading-tight">
              {collection.title}
            </h1>
            {collection.author && (
              <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">{collection.author}</p>
            )}
            <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-1">
              {resourceCount} resource{resourceCount !== 1 ? 's' : ''}
            </p>
          </div>
        </section>

        <div className="sticky top-[68px] z-20 bg-background flex gap-6 border-b border-outline px-margin-mobile">
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
          <div className="pt-stack-md">
            {sections.map((section) =>
              section.resources.length === 0 ? null : (
                <HorizontalRail
                  key={section.id || 'unsectioned'}
                  title={section.name}
                  items={mixInCollections(
                    section.resources.map((r) => toRailResourceItem(r, navigate)),
                    allCollections,
                    (c) => toRailCollectionItem(c, navigate)
                  )}
                />
              )
            )}
            {sections.every((s) => s.resources.length === 0) && (
              <p className="px-margin-mobile font-label-sm text-label-sm text-on-surface-variant italic">
                No resources in this collection yet.
              </p>
            )}
            {related.length > 0 && (
              <HorizontalRail
                title="Related Resources"
                items={related.map((r) => toRailResourceItem(r, navigate))}
              />
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
    </div>
  )
}

export default CollectionPage