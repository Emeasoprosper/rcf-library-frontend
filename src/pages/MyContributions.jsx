// pages/MyContributions.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import StatusBadge from '../components/ui/StatusBadge'
import LibraryLoader from '../components/ui/LibraryLoader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { communityApi } from '../services/api'
import { useThumbnailPolling } from '../hooks/useThumbnailPolling'

function IconDescription(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 3h7l4 4v14H7V3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  )
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}

function MyContributions() {
  const navigate = useNavigate()
  const [myUploads, setMyUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // FIX (thumbnail never appearing after upload): the backend generates
  // the real preview — or its fallback cover — as a background job that
  // finishes well AFTER this page's initial fetch already resolved. A
  // one-time fetch on mount had no way of ever picking up that later
  // result. fetchUploads is memoized with useCallback so it can be
  // safely passed to useThumbnailPolling below without re-arming the
  // poll interval every render.
  const fetchUploads = useCallback(() => {
    return communityApi
      .myUploads()
      .then(({ items }) => setMyUploads(items || []))
      .catch(() => setMyUploads([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchUploads().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchUploads])

  // Silently re-polls every few seconds ONLY while at least one item is
  // still thumbnail_status 'pending'/'processing' — stops automatically
  // once every visible item has settled to 'ready' or 'unavailable'.
  useThumbnailPolling(myUploads, fetchUploads)

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    setDeletingId(id)
    try {
      await communityApi.deleteMyUpload(id)
      setMyUploads((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setErrorMsg(err.message || 'Could not delete this submission.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="My Contributions" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        {loading && <LibraryLoader size={500} fullScreen />}

        {!loading && myUploads.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant py-stack-lg text-center">
            Nothing submitted yet.
          </p>
        )}

        {errorMsg && (
          <p className="font-label-sm text-label-sm text-red-400 mb-stack-sm">{errorMsg}</p>
        )}

        <div className="flex flex-col gap-gutter mt-stack-md">
          {myUploads.map((item) => (
            <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-outline/30 last:border-0">
              <div className="w-12 h-16 flex-none bg-surface-container-highest rounded overflow-hidden border border-outline/50 flex items-center justify-center">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : item.thumbnail_status === 'pending' || item.thumbnail_status === 'processing' ? (
                  <span className="material-symbols-outlined text-on-surface-variant text-xl animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <IconDescription className="w-6 h-6 text-on-surface-variant" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Submitted • {timeAgo(item.created_at)}
                </p>
              </div>
              <StatusBadge status={item.status} />
              {item.status !== 'approved' && (
                <button
                  onClick={() => setPendingDelete({ id: item.id, title: item.title })}
                  disabled={deletingId === item.id}
                  className="w-9 h-9 flex-none rounded-full bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-50"
                  aria-label={`Delete ${item.title}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {deletingId === item.id ? 'progress_activity' : 'delete'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this submission?"
        message={pendingDelete ? `Delete "${pendingDelete.title}" permanently? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default MyContributions