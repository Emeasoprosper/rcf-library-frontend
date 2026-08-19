import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import { listDownloads, removeOffline } from '../lib/offlineStorage'

function formatSize(bytes) {
  if (!bytes) return ''
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// FIX: thumbnails are local data URLs going forward (see
// offlineStorage.js), but resources downloaded BEFORE that fix still
// have the old raw remote URL stored in IndexedDB. isLocalImage() only
// trusts actual data: URLs — anything else (including stale remote
// URLs from old downloads) is treated as "no thumbnail" up front, so it
// falls back to the menu_book icon instead of ever attempting a dead
// network request while offline.
function isLocalImage(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

function Downloads() {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  // Secondary safety net for the rare case a data: URL itself is
  // corrupted — isLocalImage() above handles the common stale-entry
  // case up front.
  const [failedThumbIds, setFailedThumbIds] = useState(() => new Set())

  const load = useCallback(() => {
    setLoading(true)
    // Reads purely from IndexedDB — no fetch, works with zero connectivity.
    listDownloads()
      .then(setDownloads)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleThumbError = (id) => {
    setFailedThumbIds((prev) => new Set(prev).add(id))
  }

  const handleRemove = async (id, e) => {
    e.stopPropagation()
    setRemovingId(id)
    try {
      await removeOffline(id)
      setDownloads((prev) => prev.filter((d) => d.id !== id))
    } finally {
      setRemovingId(null)
    }
  }

  const totalBytes = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Downloads" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        {downloads.length > 0 && (
          <div className="flex items-center justify-between mb-stack-lg p-stack-sm rounded-xl bg-surface-container border border-outline">
            <div>
              <p className="font-body-md text-body-md text-on-surface">Available offline</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {downloads.length} file{downloads.length !== 1 ? 's' : ''} • {formatSize(totalBytes)}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl animate-spin">progress_activity</span>
          </div>
        )}

        {!loading && downloads.length === 0 && (
          <div className="flex flex-col items-center text-center py-stack-lg gap-stack-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">download_for_offline</span>
            <p className="font-body-md text-body-md font-semibold text-on-surface">Nothing here yet</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
              Download materials while you're online and they'll be available here for offline reading.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-stack-sm px-6 h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md"
            >
              Browse Materials
            </button>
          </div>
        )}

        {downloads.length > 0 && (
          <section>
            <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
              Downloaded
            </h2>
            <div className="flex flex-col gap-gutter">
              {downloads.map((item) => {
                const showThumb = isLocalImage(item.thumbnail) && !failedThumbIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/resources/${item.id}/read`)}
                    className="flex items-center gap-4 p-stack-sm rounded-xl bg-surface-container border border-outline text-left w-full cursor-pointer"
                  >
                    <div className="w-14 h-20 bg-surface-container-highest rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50">
                      {showThumb ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleThumbError(item.id)}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant">menu_book</span>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h3>
                      {item.author && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{item.author}</p>
                      )}
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {[item.category, item.level, formatSize(item.fileSize), formatDate(item.downloadDate)]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleRemove(item.id, e)}
                      disabled={removingId === item.id}
                      className="w-9 h-9 flex-none rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                      aria-label="Remove download"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {removingId === item.id ? 'progress_activity' : 'delete_outline'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default Downloads