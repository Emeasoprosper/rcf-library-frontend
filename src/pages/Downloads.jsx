import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { communityApi } from '../services/api'

function formatSize(bytes) {
  if (!bytes) return ''
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Downloads() {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    communityApi
      .downloads()
      .then(({ items }) => setDownloads(items))
      .catch((err) => setError(err.message || 'Could not load downloads.'))
      .finally(() => setLoading(false))
  }, [])

  const totalBytes = downloads.reduce((sum, d) => sum + (d.file_size_bytes || 0), 0)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Downloads" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <div className="flex items-center justify-between mb-stack-lg p-stack-sm rounded-xl bg-surface-container border border-outline">
          <div>
            <p className="font-body-md text-body-md text-on-surface">Downloads on record</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {downloads.length} file{downloads.length !== 1 ? 's' : ''} • {formatSize(totalBytes)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-stack-lg">
            <LibraryLoader size={80} />
          </div>
        )}

        {!loading && downloads.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">download_for_offline</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing downloaded yet.
            </p>
          </div>
        )}

        {downloads.length > 0 && (
          <section>
            <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
              Downloaded
            </h2>
            <div className="flex flex-col gap-gutter">
              {downloads.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/resources/${item.id}`)}
                  className="flex items-center gap-4 p-stack-sm rounded-xl bg-surface-container border border-outline text-left w-full"
                >
                  <div className="w-14 h-20 bg-surface-container-highest rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">menu_book</span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{formatSize(item.file_size_bytes)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default Downloads