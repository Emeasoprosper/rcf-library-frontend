// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminUploads.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const PAGE_SIZE = 10
const LOCK_POLL_MS = 4000

const OFFICE_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

function viewerKindFor(fileType = '') {
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.startsWith('video/')) return 'video'
  if (fileType.startsWith('audio/')) return 'audio'
  if (fileType.startsWith('image/')) return 'image'
  if (OFFICE_TYPES.has(fileType)) return 'office'
  return 'unsupported'
}

// Passive lock indicator — shown to EVERY admin in the list, no click
// needed to see it. Clicking "Preview file" on a locked item, while
// signed in as superadmin, already snatches the lock server-side (see
// claimReview handling in admin.js) — so no separate button is needed
// here; this banner is just the passive "who's on it" display.
function ReviewingBanner({ item, isMe }) {
  if (!item.reviewing_by) return null

  return (
    <div className="flex items-center gap-2 px-stack-md py-2.5 bg-orange-500/10 border-t border-orange-500/20">
      <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container-high flex-none flex items-center justify-center">
        {item.reviewer_avatar_url ? (
          <img src={item.reviewer_avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-label-sm text-orange-400 truncate">
          {isMe ? 'You are reviewing' : `${item.reviewer_name || item.reviewer_email} is reviewing`}
        </p>
        {!isMe && <p className="font-label-sm text-label-sm text-orange-400/60 truncate">{item.reviewer_email}</p>}
      </div>
    </div>
  )
}

// Native in-app viewer. PDF/video/audio/image stream through our own
// backend using a short-lived signed token. Office docs go through
// Google's embedded viewer pointed at that same signed stream URL.
// While open, the parent polls lock-status and passes `kickedBy` down
// the instant a superadmin snatches the review elsewhere — this modal
// then hands off automatically instead of staying open on a stale lock.
function PreviewModal({ item, streamUrl, kickedBy, onClose }) {
  if (!item) return null

  const kind = viewerKindFor(item.file_type)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" onClick={onClose}>
      <div
        className="flex-none flex items-center gap-3 px-margin-mobile py-stack-md bg-surface-container border-b border-outline"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="w-9 h-9 flex-none rounded-full bg-surface-container-high flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high flex-none flex items-center justify-center">
          {item.contributor_avatar_url ? (
            <img src={item.contributor_avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
            {item.contributor_name} · {item.contributor_email}
          </p>
        </div>
      </div>

      {kickedBy && (
        <div className="flex-none px-margin-mobile py-stack-sm bg-orange-500/15 border-b border-orange-500/30" onClick={(e) => e.stopPropagation()}>
          <p className="font-label-sm text-label-sm text-orange-400">
            {kickedBy} (superadmin) took over this review — closing…
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
        {!streamUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <LibraryLoader size={80} />
          </div>
        )}

        {streamUrl && kind === 'pdf' && (
          <iframe src={streamUrl} className="w-full h-full border-0 bg-white" title={`Preview of ${item.title}`} />
        )}

        {streamUrl && kind === 'office' && (
          <iframe
            src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(streamUrl)}`}
            className="w-full h-full border-0 bg-white"
            title={`Preview of ${item.title}`}
          />
        )}

        {streamUrl && kind === 'image' && (
          <div className="w-full h-full flex items-center justify-center bg-black overflow-auto">
            <img src={streamUrl} alt={item.title} className="max-w-full max-h-full object-contain" />
          </div>
        )}

        {streamUrl && kind === 'video' && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video src={streamUrl} controls autoPlay={false} className="max-w-full max-h-full" />
          </div>
        )}

        {streamUrl && kind === 'audio' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-stack-md px-margin-mobile">
            <span className="material-symbols-outlined text-on-surface-variant text-6xl">graphic_eq</span>
            <audio src={streamUrl} controls className="w-full max-w-sm" />
          </div>
        )}

        {streamUrl && kind === 'unsupported' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-stack-sm px-margin-mobile text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">description</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              In-app preview isn't available for this file type ({item.file_type}).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminUploads() {
  const { user } = useAuth()
  const isSuperadmin = user?.role === 'superadmin'

  const [uploads, setUploads] = useState([])
  const [decided, setDecided] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [previewStreamUrl, setPreviewStreamUrl] = useState(null)
  const [kickedBy, setKickedBy] = useState(null)
  const [lockNotice, setLockNotice] = useState('')

  const previewItemRef = useRef(null)
  const pollTimerRef = useRef(null)

  const fetchUploads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { items } = await adminApi.pendingUploads({ search: query, page, pageSize: PAGE_SIZE })
      setUploads(items)
    } catch (err) {
      setError(err.message || 'Could not load pending uploads.')
    } finally {
      setLoading(false)
    }
  }, [query, page])

  useEffect(() => {
    fetchUploads()
  }, [fetchUploads])

  useEffect(() => {
    return () => {
      if (previewItemRef.current) adminApi.releaseReview(previewItemRef.current.id).catch(() => {})
      clearInterval(pollTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto hands-off: while a preview is open, poll whether we still hold
  // the lock. If a superadmin snatched it, show the notice and close on
  // our own — the other admin never has to hit "Approve" first to find
  // out they lost it via a 409.
  useEffect(() => {
    clearInterval(pollTimerRef.current)
    if (!previewItem) return undefined

    pollTimerRef.current = setInterval(async () => {
      try {
        const status = await adminApi.lockStatus(previewItem.id)
        if (status.reviewingBy && status.reviewingBy !== user?.id) {
          setKickedBy(status.reviewerName || status.reviewerEmail || 'Someone')
          clearInterval(pollTimerRef.current)
          setTimeout(() => {
            setPreviewItem(null)
            setPreviewStreamUrl(null)
            setKickedBy(null)
            setLockNotice(`${status.reviewerName || status.reviewerEmail} took over this review.`)
            fetchUploads()
          }, 1800)
        }
      } catch {
        // transient — next poll tries again
      }
    }, LOCK_POLL_MS)

    return () => clearInterval(pollTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewItem, user?.id])

  const openPreview = async (item) => {
    setLockNotice('')
    setKickedBy(null)
    try {
      await adminApi.claimReview(item.id) // superadmin claim here IS the "take over" — always wins server-side
      previewItemRef.current = item
      setPreviewItem(item)
      setPreviewStreamUrl(null)
      const { token } = await adminApi.previewToken(item.id)
      setPreviewStreamUrl(adminApi.previewStreamUrl(item.id, token))
      fetchUploads()
    } catch (err) {
      setLockNotice(err.message || 'Someone else is currently reviewing this item.')
    }
  }

  const closePreview = async () => {
    if (previewItem) {
      try {
        await adminApi.releaseReview(previewItem.id)
      } catch {
        // non-critical — lock auto-expires
      }
      fetchUploads()
    }
    previewItemRef.current = null
    setPreviewItem(null)
    setPreviewStreamUrl(null)
    setKickedBy(null)
  }

  const decide = async (id, decision) => {
    setBusyId(id)
    setLockNotice('')
    const item = uploads.find((u) => u.id === id)
    try {
      if (decision === 'approved') {
        await adminApi.approveUpload(id)
      } else {
        await adminApi.rejectUpload(id, null)
      }
      setUploads((prev) => prev.filter((u) => u.id !== id))
      setDecided((prev) => [{ ...item, decision, decided_by_name: user?.name }, ...prev])
      if (previewItem?.id === id) {
        previewItemRef.current = null
        setPreviewItem(null)
        setPreviewStreamUrl(null)
      }
    } catch (err) {
      if (err.message?.includes('reviewing')) {
        setLockNotice(err.message)
        fetchUploads()
      } else {
        setError(err.message || 'Action failed. Please try again.')
      }
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(uploads.length / PAGE_SIZE))

  const handleSearch = (value) => {
    setQuery(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Uploads" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
          Review and manage recent library submissions.
        </p>

        <div className="relative mb-stack-lg">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by title or contributor..."
            className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
          />
        </div>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {lockNotice && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-orange-500/10 border border-orange-500/30">
            <p className="font-body-md text-body-md text-orange-400">{lockNotice}</p>
          </div>
        )}

        <section className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
            Pending ({uploads.length})
          </h2>

          {loading && <LibraryLoader size={120} fullScreen />}

          {!loading && uploads.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-md">
              {query ? 'No matches for that search.' : "Nothing pending — you're caught up."}
            </p>
          )}

          {!loading && uploads.length > 0 && (
            <>
              <div className="flex flex-col gap-gutter">
                {uploads.map((item) => {
                  const isMe = item.reviewing_by === user?.id
                  const lockedByOther = item.reviewing_by && !isMe
                  const showActions = !lockedByOther || isSuperadmin

                  return (
                    <div key={item.id} className="rounded-2xl bg-surface-container border border-outline overflow-hidden">
                      <div className="flex gap-4 p-stack-md">
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">description</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-body-md text-body-md font-semibold text-on-surface leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 rounded-full overflow-hidden bg-surface-container-high flex-none flex items-center justify-center">
                                {item.contributor_avatar_url ? (
                                  <img src={item.contributor_avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="material-symbols-outlined text-[9px] text-on-surface-variant">person</span>
                                )}
                              </div>
                              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                {item.contributor_name} · {item.file_type} · {(item.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </div>

                          {item.file_id && (
                            <button
                              onClick={() => openPreview(item)}
                              className="inline-flex items-center gap-1 mt-2 font-label-sm text-label-sm text-primary w-fit"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              {lockedByOther && isSuperadmin ? 'Preview & take over' : 'Preview file'}
                            </button>
                          )}
                        </div>
                      </div>

                      {lockedByOther && <ReviewingBanner item={item} isMe={isMe} />}

                      {showActions && (
                        <div className="flex border-t border-outline">
                          <button
                            onClick={() => decide(item.id, 'approved')}
                            disabled={busyId === item.id}
                            className="flex-1 flex items-center justify-center gap-1 py-3 text-primary font-label-sm text-label-sm disabled:opacity-50 border-r border-outline"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            {busyId === item.id ? 'Working…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => decide(item.id, 'rejected')}
                            disabled={busyId === item.id}
                            className="flex-1 flex items-center justify-center gap-1 py-3 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </section>

        {decided.length > 0 && (
          <section>
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
              Just Decided
            </h2>
            <div className="flex flex-col gap-gutter">
              {decided.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-stack-sm rounded-xl bg-surface-container border border-outline opacity-60">
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md text-on-surface truncate">{item.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {item.decision === 'approved' ? 'Approved' : 'Rejected'} by {item.decided_by_name || 'you'}
                    </p>
                  </div>
                  <StatusBadge status={item.decision === 'approved' ? 'approved' : 'reviewing'} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <AdminNav />

      <PreviewModal item={previewItem} streamUrl={previewStreamUrl} kickedBy={kickedBy} onClose={closePreview} />
    </div>
  )
}

export default AdminUploads