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

// A request group's `details` array holds one entry per underlying
// request (see admin.js) — each may carry department/level/searchQuery
// captured automatically from Search.jsx / RequestMaterial.jsx. This
// pulls out whatever's present across the group without assuming every
// member has the same values.
function summarizeDetails(details) {
  if (!details || details.length === 0) return null
  const departments = [...new Set(details.map((d) => d.department).filter(Boolean))]
  const levels = [...new Set(details.map((d) => d.level).filter(Boolean))]
  const searchQueries = [...new Set(details.map((d) => d.searchQuery).filter(Boolean))]
  if (departments.length === 0 && levels.length === 0 && searchQueries.length === 0) return null
  return { departments, levels, searchQueries }
}

function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [fulfilled, setFulfilled] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  // Which group's inline "paste resource ID" field is currently open.
  const [fulfillingId, setFulfillingId] = useState(null)
  const [resourceIdInput, setResourceIdInput] = useState('')

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

  // Resolves every underlying request in the group, not just one — a
  // group of 4 identical requests means 4 material_requests rows, and
  // each requester should get their own "resolved" notification (the
  // backend already sends one per row in PATCH /admin/requests/:id).
  const resolveGroup = async (group, status, fulfilledResourceId) => {
    setBusyId(group.id)
    try {
      await Promise.all(
        group.memberIds.map((id) => adminApi.resolveRequest(id, status, fulfilledResourceId || null))
      )
      setRequests((prev) => prev.filter((r) => r.id !== group.id))
      setFulfilled((prev) => [{ ...group, outcome: status }, ...prev])
      setFulfillingId(null)
      setResourceIdInput('')
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setBusyId(null)
    }
  }

  const openFulfillInput = (groupId) => {
    setFulfillingId(groupId)
    setResourceIdInput('')
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
            {requests.map((group) => {
              const detailSummary = summarizeDetails(group.details)
              const isFulfilling = fulfillingId === group.id

              return (
                <div key={group.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="min-w-0">
                      <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                        {group.title}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {group.requestCount > 1
                          ? `${group.requestCount} students want this`
                          : `Requested by ${group.requesters[0]?.name || 'a student'}`}
                        {' • '}{timeAgo(group.createdAt)}
                      </p>
                      {group.courseCode && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                          {group.courseCode}
                        </p>
                      )}
                    </div>
                    {group.requestCount > 1 && (
                      <span className="flex-none px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-label-sm">
                        {group.requestCount}×
                      </span>
                    )}
                  </div>

                  {detailSummary && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {detailSummary.departments.map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-label-sm">
                          {d}
                        </span>
                      ))}
                      {detailSummary.levels.map((l) => (
                        <span key={l} className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-label-sm">
                          {l} Level
                        </span>
                      ))}
                    </div>
                  )}

                  {detailSummary?.searchQueries.length > 0 && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant italic mb-1">
                      Searched: "{detailSummary.searchQueries.join('", "')}"
                    </p>
                  )}

                  {group.notes.length > 0 && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-2 italic">
                      "{group.notes[0]}"
                    </p>
                  )}

                  {isFulfilling ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        type="text"
                        value={resourceIdInput}
                        onChange={(e) => setResourceIdInput(e.target.value)}
                        placeholder="Paste the resource ID to link (optional)"
                        className="w-full h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant text-sm focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveGroup(group, 'fulfilled', resourceIdInput.trim())}
                          disabled={busyId === group.id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          {busyId === group.id ? 'Working…' : 'Confirm Fulfilled'}
                        </button>
                        <button
                          onClick={() => setFulfillingId(null)}
                          disabled={busyId === group.id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openFulfillInput(group.id)}
                        disabled={busyId === group.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Mark Fulfilled
                      </button>
                      <button
                        onClick={() => resolveGroup(group, 'declined')}
                        disabled={busyId === group.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        {busyId === group.id ? 'Working…' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {fulfilled.length > 0 && (
          <section>
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
              Recently Resolved
            </h2>
            <div className="flex flex-col gap-gutter">
              {fulfilled.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-stack-sm rounded-xl bg-surface-container border border-outline opacity-60">
                  <p className="font-body-md text-body-md text-on-surface truncate">
                    {group.title}{group.requestCount > 1 ? ` (${group.requestCount}×)` : ''}
                  </p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">{group.outcome}</span>
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