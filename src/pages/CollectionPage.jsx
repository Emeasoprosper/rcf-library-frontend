import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import HorizontalRail from '../components/resource/HorizontalRail'
import { resourceCollectionsApi, resourcesApi } from '../services/api'

function toRailItems(resources, navigate) {
  return resources.map((r) => ({
    id: r.id,
    title: r.title,
    fileType: r.file_type,
    thumbnailUrl: r.thumbnail_url ? resourcesApi.thumbnailUrl(r.id) : null,
    thumbnailStatus: r.thumbnail_status,
    subtitle: r.chapter || r.part || r.volume || r.edition || null,
    onClick: () => navigate(`/library/${r.id}`),
  }))
}

function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    resourceCollectionsApi
      .get(id)
      .then((res) => { if (!cancelled) setData(res) })
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
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-margin-mobile text-center">
        <TopAppBar title="Collection" showBack onBack={() => navigate(-1)} />
        <p className="font-body-md text-body-md text-on-surface-variant mt-[68px]">
          {error || 'Collection not found.'}
        </p>
      </div>
    )
  }

  const { collection, sections, related } = data

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title={collection.title} showBack onBack={() => navigate(-1)} />

      <main className="pb-32 pt-[68px]">
        <section className="px-margin-mobile flex flex-col items-center text-center mb-stack-lg">
          <div className="w-40 h-40 rounded-xl overflow-hidden bg-surface-container-high border border-outline mb-stack-md flex items-center justify-center">
            {collection.cover_url ? (
              <img src={collection.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-4xl">library_books</span>
            )}
          </div>
          <h1 className="font-headline-lg text-headline-lg font-display text-on-surface">{collection.title}</h1>
          {collection.author && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{collection.author}</p>
          )}
          {collection.description && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md">{collection.description}</p>
          )}
        </section>

        {sections.map((section) => (
          <HorizontalRail
            key={section.id || 'unsectioned'}
            title={section.name}
            items={toRailItems(section.resources, navigate)}
          />
        ))}

        <HorizontalRail
          title="You May Also Like"
          items={toRailItems(related.map((r) => ({ ...r, chapter: null, part: null, volume: null, edition: null })), navigate)}
        />
      </main>
    </div>
  )
}

export default CollectionPage