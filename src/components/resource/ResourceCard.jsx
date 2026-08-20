// RCFMOUAULIBRARYreact/student-dashboard/src/components/resource/ResourceCard.jsx
import { useState } from 'react'
import { getMediaKind, MEDIA_KIND_STYLE } from '../../lib/mediaKind'
import { getFileGradient } from '../../lib/fileGradient'
import MediaTypeIcon from '../icons/MediaTypeIcon'
import { resourcesApi } from '../../services/api'

const KIND_LABEL = { book: 'Book', audio: 'Audio', video: 'Video' }

function splitMeta(meta) {
  if (!meta) return { author: null, year: null }
  const parts = meta.split(' • ')
  return { author: parts[0] || null, year: parts[1] || null }
}

function ResourceCard({ id, title, meta, tags, thumbnailUrl, thumbnailStatus, fileType, onClick }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [sharing, setSharing] = useState(false)

  const kind = getMediaKind(fileType)
  const showImage = Boolean(thumbnailUrl) && !imgFailed
  const gradientKey = thumbnailUrl || title || fileType || 'resource'
  const isProcessing = thumbnailStatus === 'processing'
  const { author, year } = splitMeta(meta)

  const [, sizeTag] = tags

  // Only rendered when the caller passes an `id` — grids that haven't
  // been updated to pass one simply don't show the button, nothing else
  // about the card changes.
  const handleShare = async (e) => {
    e.stopPropagation()
    if (!id) return
    setSharing(true)
    try {
      const { shareUrl } = await resourcesApi.createShareLink(id)
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied!')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') alert('Could not create share link — please try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="group relative w-full rounded-xl bg-surface-container p-3 transition-all duration-300 hover:bg-surface-container-high border border-outline/50 shadow-lg cursor-pointer"
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-md"
        style={showImage ? undefined : { background: getFileGradient(gradientKey) }}
      >
        {showImage ? (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            {isProcessing ? (
              <span className="material-symbols-outlined text-white/90 text-3xl">hourglass_top</span>
            ) : (
              <MediaTypeIcon kind={kind} className="w-16 h-16" />
            )}
          </span>
        )}

        {kind === 'video' && showImage && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">play_arrow</span>
            </span>
          </span>
        )}

        {id && (
          <button
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share"
            className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-white text-[18px]">
              {sharing ? 'progress_activity' : 'share'}
            </span>
          </button>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform duration-200 group-hover:scale-105">
            <span className="material-symbols-outlined text-[26px]">
              {kind === 'book' ? 'menu_book' : 'play_arrow'}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-0.5 min-w-0">
        <h3 className="truncate text-sm font-bold text-on-surface group-hover:underline">{title}</h3>
        {(author || year) && (
          <p className="text-xs font-medium text-on-surface-variant truncate">
            {[author, year].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5 min-w-0 flex-1">
          <MediaTypeIcon kind={kind} className="w-4 h-4 flex-none" />
          <span className="truncate">{KIND_LABEL[kind] || 'Resource'}</span>
        </span>
        {sizeTag && (
          <span className="flex items-center gap-1 min-w-0 flex-none">
            <span className="material-symbols-outlined text-[14px] flex-none">{sizeTag.icon}</span>
            <span className="truncate">{sizeTag.label}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default ResourceCard