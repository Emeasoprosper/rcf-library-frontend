import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [fulfilled, setFulfilled] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { items } = await adminApi.requests()
      setRequests(items)
    } catch (err) {
      setError(err.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const resolve = async (id, status) => {
    setBusyId(id)
    const item = requests.find((r) => r.id === id)
    try {
      await adminApi.resolveRequest(id, status)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      setFulfilled((prev) => [{ ...item, outcome: status }, ...prev])
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Requests" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
          Materials students have asked the library to add.
        </p>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        <section className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            Open ({requests.length})
          </h2>

          {loading && <LibraryLoader size={120} fullScreen />}

          {!loading && requests.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-md">
              No open requests right now.
            </p>
          )}

          <div className="flex flex-col gap-gutter">
            {requests.map((item) => (
              <div key={item.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                      {item.title}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Requested by {item.requester_name} • {timeAgo(item.created_at)}
                    </p>
                    {item.notes && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(item.id, 'fulfilled')}
                    disabled={busyId === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Mark Fulfilled
                  </button>
                  <button
                    onClick={() => resolve(item.id, 'declined')}
                    disabled={busyId === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {fulfilled.length > 0 && (
          <section>
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
              Recently Resolved
            </h2>
            <div className="flex flex-col gap-gutter">
              {fulfilled.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-stack-sm rounded-xl bg-surface-container border border-outline opacity-60">
                  <p className="font-body-md text-body-md text-on-surface truncate">{item.title}</p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">{item.outcome}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminRequests