import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { adminApi } from '../../services/api'
import { useThumbnailPolling } from '../../hooks/useThumbnailPolling'

function AdminResources() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null) // { id, title } | null
  const [warning, setWarning] = useState(null) // { message, driveErrors } | null

  // FIX (thumbnail never appearing after upload): same root cause as
  // MyContributions.jsx — the backend's real preview generation is a
  // background job that finishes after this page's fetch already
  // resolved. Wrapped in useCallback so it's safe to pass into
  // useThumbnailPolling below.
  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await adminApi.resources({ status: 'approved', search })
      setItems(res.items || [])
    } catch (err) {
      console.error('Failed to load resources:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(load, 300) // debounce search
    return () => clearTimeout(timeout)
  }, [load])

  // Silently re-polls every few seconds ONLY while at least one item is
  // still thumbnail_status 'pending'/'processing' — stops automatically
  // once every visible item has settled.
  useThumbnailPolling(items, load)

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    setDeletingId(id)
    try {
      const res = await adminApi.deleteResource(id)
      setItems((prev) => prev.filter((r) => r.id !== id))
      if (res?.warning) {
        setWarning({
          message: res.warning,
          driveErrors: res.driveErrors || [],
        })
      }
    } catch {
      setWarning({ message: 'Failed to delete — please try again.', driveErrors: [] })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Manage Resources" showBack />

      <main className="px-margin-mobile pt-[68px] pb-32">
        <button
          onClick={() => navigate('/admin/organize')}
          className="w-full mt-stack-md p-stack-md rounded-xl bg-primary/10 border border-primary/30 text-left flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-primary text-2xl">library_books</span>
          <div>
            <p className="font-body-md text-body-md font-semibold text-primary">Organize Resources</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Assign author, category, or collection to unsorted uploads</p>
          </div>
        </button>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search approved resources..."
          className="w-full h-12 px-4 mt-stack-md mb-stack-md bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
        />

        {loading && (
          <p className="text-on-surface-variant font-body-md py-stack-md text-center">Loading…</p>
        )}

        {loadError && !loading && (
          <div className="py-stack-md text-center">
            <p className="text-red-400 font-body-md mb-2">
              Couldn't load resources — check that the server is running and try again.
            </p>
            <button onClick={load} className="text-primary font-label-md underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <p className="text-on-surface-variant font-body-md py-stack-md text-center">No approved resources found.</p>
        )}

        <div className="flex flex-col gap-gutter">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container border border-outline">
              <div className="w-12 h-16 flex-none bg-surface-container-highest rounded overflow-hidden border border-outline/50">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : item.thumbnail_status === 'pending' || item.thumbnail_status === 'processing' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl animate-spin">
                      progress_activity
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">description</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {item.author ? `${item.author} • ` : ''}{item.contributor_name}
                </p>
              </div>
              <button
                onClick={() => setPendingDelete({ id: item.id, title: item.title })}
                disabled={deletingId === item.id}
                className="w-10 h-10 flex-none rounded-full bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-50"
                aria-label={`Delete ${item.title}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {deletingId === item.id ? 'progress_activity' : 'delete'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </main>

      <AdminNav />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this resource?"
        message={pendingDelete ? `Delete "${pendingDelete.title}" permanently? This removes the file and cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={!!warning}
        title="Heads up"
        message={
          warning
            ? `${warning.message}${
                warning.driveErrors.length
                  ? `\n\nAffected file ID(s): ${warning.driveErrors.map((e) => e.fileId || '(unknown)').join(', ')}`
                  : ''
              }`
            : ''
        }
        confirmLabel="Got it"
        onConfirm={() => setWarning(null)}
        onCancel={() => setWarning(null)}
      />
    </div>
  )
}

export default AdminResources