import { useState, useEffect } from 'react'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { communityApi, resourcesApi } from '../services/api'

function SavedResources() {
  const [view, setView] = useState('grid')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    communityApi
      .bookmarks()
      .then(({ items }) => setItems(items))
      .catch((err) => setError(err.message || 'Could not load saved resources.'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      await resourcesApi.unbookmark(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Could not remove bookmark.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Saved Resources" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
          Resources you've bookmarked for later.
        </p>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}
        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">bookmark_border</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing saved yet — tap the bookmark icon on any resource to keep it here.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-stack-sm">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                All Saved ({items.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1 rounded ${view === 'grid' ? 'text-primary' : 'text-on-surface-variant'}`}
                  aria-label="Grid view"
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1 rounded ${view === 'list' ? 'text-primary' : 'text-on-surface-variant'}`}
                  aria-label="List view"
                >
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
            </div>

            {view === 'grid' ? (
              <div className="grid grid-cols-2 gap-gutter">
                {items.map((item) => (
                  <div key={item.id} className="group">
                    <div className="aspect-[3/4] w-full bg-surface-container border border-outline rounded-lg overflow-hidden mb-2 flex items-center justify-center transition-colors group-hover:border-on-surface-variant">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-3xl">menu_book</span>
                      )}
                    </div>
                    <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">{item.title}</h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{item.author}</p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="mt-1 text-[11px] font-label-sm text-error hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-gutter">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-stack-sm rounded-xl bg-surface-container border border-outline">
                    <div className="w-14 h-20 bg-surface-container-highest rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant">menu_book</span>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h4>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{item.author}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="flex-none p-2 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
                      aria-label="Remove bookmark"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">bookmark_remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default SavedResources