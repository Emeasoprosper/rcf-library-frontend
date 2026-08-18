import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resourcesApi } from '../services/api'
import HorizontalRail from '../components/resource/HorizontalRail'
import { saveOffline, isOfflineAvailable } from '../lib/offlineStorage'
import { getMediaKind } from '../lib/mediaKind'
import { isRunningAsInstalledApp } from '../lib/pwaInstall'
import DownloadGateModal from '../components/ui/DownloadGateModal'

function formatMinutes(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

const KIND_ACTION = {
  document: { label: 'Read Book', icon: 'book_bookmark', relatedTitle: 'You May Like' },
  video: { label: 'Watch Video', icon: 'play_circle', relatedTitle: 'More Videos Like This' },
  audio: { label: 'Listen', icon: 'headphones', relatedTitle: 'More Audio Like This' },
}

// Custom book-with-bookmark glyph for the "Read Book" action — the built-in
// Material Symbols set didn't have a good match. Single-color, outlined in
// currentColor only (no fills), same 20-ish px box as the Material icons
// next to it so it lines up in the button.
function BookBookmarkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 4.5C4 3.67 4.67 3 5.5 3H12V20H5.5C4.67 20 4 19.33 4 18.5V4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 3H18.5C19.33 3 20 3.67 20 4.5V18.5C20 19.33 19.33 20 18.5 20H12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 12V20L16.5 18.2L18.5 20V12H14.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ActionIcon({ icon, className }) {
  if (icon === 'book_bookmark') return <BookBookmarkIcon className={className} />
  return <span className={`material-symbols-outlined ${className || ''}`}>{icon}</span>
}

// Scores a candidate resource against the one currently being viewed, so
// "More Like This" reflects topic/subject match instead of just "also a
// video". Same-kind is enforced by the filter before this ever runs.
function relatedScore(candidate, current) {
  let score = 0
  if (current.category && candidate.category === current.category) score += 3
  if (current.department && candidate.department === current.department) score += 2
  if (current.course_code && candidate.course_code === current.course_code) score += 2
  return score
}

function toRelatedItem(r, navigate) {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.author,
    thumbnailUrl: r.thumbnail_url,
    thumbnailStatus: r.thumbnail_status,
    fileType: r.file_type,
    contributorName: r.contributor_name,
    contributorAvatarUrl: r.contributor_avatar_url,
    isAdminUpload: r.is_admin_upload,
    onClick: () => navigate(`/resources/${r.id}`),
  }
}

function ResourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [resource, setResource] = useState(null)
  const [youMayLike, setYouMayLike] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [showGate, setShowGate] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await resourcesApi.get(id)
        if (cancelled) return
        setResource(res.resource)
        setSaved(Boolean(res.resource.is_bookmarked))

        const kind = getMediaKind(res.resource.file_type)

        // Pull a wider pool (30, not 8) so there's enough same-kind
        // material to actually rank by topic match instead of just
        // taking whatever happened to be popular.
        const related = await resourcesApi.list({ sort: 'popular', pageSize: 30 })
        if (cancelled) return

        const sameKind = (related.items || []).filter(
          (r) => r.id !== id && getMediaKind(r.file_type) === kind
        )
        const ranked = sameKind
          .map((r) => ({ r, score: relatedScore(r, res.resource) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map(({ r }) => toRelatedItem(r, navigate))

        setYouMayLike(ranked)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    isOfflineAvailable(id).then(setDownloaded)
  }, [id])

  // Strict install gate: nothing is fetched until we've confirmed this
  // tab is currently running inside the installed PWA. If not, block
  // here and show the gate popup — the fetch/save flow below never runs.
  const handleDownload = async () => {
    if (!isRunningAsInstalledApp()) {
      setShowGate(true)
      return
    }

    setDownloading(true)
    try {
      await resourcesApi.download(id)
      const { blob, mimeType } = await resourcesApi.downloadFileForOffline(id)
      await saveOffline(id, blob, mimeType, {
        title: resource?.title,
        author: resource?.author,
        category: resource?.category,
        department: resource?.department,
        level: resource?.level,
        thumbnail: resource?.thumbnail_url,
      })
      setDownloaded(true)
    } catch {
      alert('Download failed — please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleToggleSave = async () => {
    setSavingBookmark(true)
    try {
      if (saved) {
        await resourcesApi.unbookmark(id)
        setSaved(false)
      } else {
        await resourcesApi.bookmark(id)
        setSaved(true)
      }
    } catch {
      alert('Could not update saved status — please try again.')
    } finally {
      setSavingBookmark(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl animate-spin">
          progress_activity
        </span>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">error</span>
        <p className="text-on-surface-variant font-body-md">This resource couldn't be found.</p>
        <button onClick={() => navigate(-1)} className="text-primary font-label-md">Go back</button>
      </div>
    )
  }

  const kind = getMediaKind(resource.file_type)
  const action = KIND_ACTION[kind]

  const readingEstimate = formatMinutes(resource.est_reading_min)
  const listeningEstimate = formatMinutes(resource.est_listening_min)
  const watchingEstimate = formatMinutes(resource.est_watching_min)
  const duration = readingEstimate || listeningEstimate || watchingEstimate

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32">
      <div className="relative w-full h-[52vh] min-h-[360px] overflow-hidden bg-surface-container-highest">
        {resource.thumbnail_url && (
          <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(120% 90% at 15% 100%, var(--color-background) 30%, transparent 70%),
              radial-gradient(90% 70% at 85% 100%, var(--color-background) 20%, transparent 65%),
              radial-gradient(140% 60% at 50% 115%, var(--color-background) 45%, transparent 75%),
              linear-gradient(to bottom, transparent 40%, var(--color-background) 96%)
            `,
          }}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        <button
          onClick={handleToggleSave}
          disabled={savingBookmark}
          className="absolute top-6 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center disabled:opacity-60"
          aria-label={saved ? 'Remove from saved' : 'Save for later'}
        >
          <span className="material-symbols-outlined text-white">
            {savingBookmark ? 'progress_activity' : saved ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      <div className="px-margin-mobile -mt-16 relative z-10">
        {resource.author && (
          <p className="font-label-md text-label-md text-primary mb-1">By {resource.author}</p>
        )}

        <h1 className="font-headline-lg text-headline-lg font-display text-on-surface mb-2 break-words">
          {resource.title}
        </h1>

        {resource.description && (
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {resource.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {resource.category && (
            <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface text-label-sm font-label-sm">
              {resource.category}
            </span>
          )}
          {resource.department && (
            <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface text-label-sm font-label-sm">
              {resource.department}
            </span>
          )}
          {resource.level && (
            <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface text-label-sm font-label-sm">
              {resource.level} Level
            </span>
          )}
        </div>

        <div className="flex items-center gap-5 mb-8 flex-wrap">
          {resource.page_count && (
            <span className="flex items-center gap-1.5 text-label-md font-label-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">description</span>
              {resource.page_count} pages
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1.5 text-label-md font-label-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              {duration}
            </span>
          )}
        </div>

        {youMayLike.length > 0 && (
          <div className="-mx-margin-mobile">
            <HorizontalRail title={action.relatedTitle} items={youMayLike} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 px-margin-mobile py-4 bg-background border-t border-outline flex gap-3">
        <button
          onClick={() => navigate(`/resources/${id}/read`)}
          className="flex-1 h-14 rounded-full bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2"
        >
          <ActionIcon icon={action.icon} className="w-5 h-5" />
          {action.label}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading || downloaded}
          className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center disabled:opacity-60"
          aria-label="Download for offline"
        >
          <span className="material-symbols-outlined text-orange-500">
            {downloading ? 'progress_activity' : downloaded ? 'download_done' : 'download'}
          </span>
        </button>
      </div>

      <DownloadGateModal open={showGate} onClose={() => setShowGate(false)} />
    </div>
  )
}

export default ResourceDetail