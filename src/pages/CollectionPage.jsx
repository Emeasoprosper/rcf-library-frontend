import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { resourceCollectionsApi } from '../services/api'
import { getMediaKind } from '../lib/mediaKind'

const TABS = ['Sections', 'About', 'More Like This']

function ResourceRow({ resource, navigate }) {
  const kind = getMediaKind(resource.file_type)
  const subtitle = resource.chapter || resource.part || resource.volume || resource.edition || null
  const isReadable = kind === 'book'
  const targetPath = isReadable ? `/library/${resource.id}` : `/resources/${resource.id}/read`

  return (
    <div
      onClick={() => navigate(targetPath)}
      className="flex items-center gap-3 py-stack-sm border-b border-outline/30 last:border-0 cursor-pointer group"
    >
      <div className="w-12 h-12 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              {resource.thumbnail_status === 'processing' ? 'hourglass_top' : 'description'}
            </span>
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-body-md text-body-md font-semibold text-on-surface truncate group-hover:underline">
          {resource.title}
        </p>
        {subtitle && <p className="font-label-sm text-label-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); navigate(targetPath) }}
        className="w-9 h-9 flex-none rounded-full bg-primary text-on-primary flex items-center justify-center"
        aria-label={isReadable ? 'Read' : 'Play'}
      >
        <span className="material-symbols-outlined text-[18px]">{isReadable ? 'menu_book' : 'play_arrow'}</span>
      </button>
    </div>
  )
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

        <div className="px-margin-mobile pt-stack-md">
          {activeTab === 'Sections' && (
            <div className="flex flex-col gap-stack-lg">
              {sections.map((section) => (
                <div key={section.id || 'unsectioned'}>
                  <h3 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-1">
                    {section.name}
                  </h3>
                  {section.resources.length === 0 ? (
                    <p className="font-label-sm text-label-sm text-on-surface-variant italic py-stack-sm">
                      No resources in this section yet.
                    </p>
                  ) : (
                    section.resources.map((r) => <ResourceRow key={r.id} resource={r} navigate={navigate} />)
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'About' && (
            <div className="py-stack-sm">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {collection.description || 'No description available for this collection yet.'}
              </p>
            </div>
          )}

          {activeTab === 'More Like This' && (
            <div className="flex flex-col gap-gutter py-stack-sm">
              {allCollections.length === 0 && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">No other collections yet.</p>
              )}
              {allCollections.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/collections/${c.id}`)}
                  className="flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline cursor-pointer"
                >
                  <div className="w-14 h-14 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">library_books</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{c.title}</p>
                    {c.author && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{c.author}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'Sections' && related.length > 0 && (
          <section className="mt-stack-lg px-margin-mobile">
            <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
              Related Resources
            </h2>
            <div className="flex flex-col">
              {related.map((r) => <ResourceRow key={r.id} resource={r} navigate={navigate} />)}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default CollectionPage