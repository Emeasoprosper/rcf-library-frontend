import { useState } from 'react'
import { getMediaKind, MEDIA_KIND_STYLE } from '../../lib/mediaKind'
import { getFileGradient } from '../../lib/fileGradient'

const categoryIcons = {
  book: 'menu_book',
  paper: 'article',
  devotional: 'auto_stories',
  audio: 'graphic_eq',
  video: 'movie',
  collection: 'library_books',
  past_question: 'quiz',
  default: 'description',
}

// Renders the real generated thumbnail (thumbnailUrl) when one exists.
// Falls back to a deterministic gradient (same file always looks the
// same) with a centered icon when there's no thumbnail yet, and swaps
// the icon for an hourglass while one is still being generated
// server-side (thumbnailStatus === 'processing'). If thumbnailUrl itself
// fails to load (broken link, 404) it drops back to the gradient+icon
// treatment instead of showing a broken image icon.
function ResourceThumbnail({
  category = 'default',
  size = 'w-20 h-28',
  thumbnailUrl,
  thumbnailStatus,
  fileType,
  title = '',
}) {
  const [imgFailed, setImgFailed] = useState(false)

  const kind = getMediaKind(fileType)
  const kindStyle = MEDIA_KIND_STYLE[kind]
  const icon = categoryIcons[category] || kindStyle?.gridIcon || categoryIcons.default
  const gradientKey = thumbnailUrl || title || category
  const showImage = Boolean(thumbnailUrl) && !imgFailed

  return (
    <div
      className={`${size} rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline/50`}
      style={showImage ? undefined : { background: getFileGradient(gradientKey) }}
    >
      {showImage ? (
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="material-symbols-outlined text-white/90 text-3xl">
          {thumbnailStatus === 'processing' ? 'hourglass_top' : icon}
        </span>
      )}
    </div>
  )
}

export default ResourceThumbnail