import { useState, useEffect } from 'react'
import { extractAccentColorMixedWithBlack } from '../../lib/extractAccentColor'

// Full-width banner style — stretches edge to edge (minus the page's
// own margins) rather than sitting in a horizontal scroll rail, so a
// collection reads as a distinct, prominent thing on the homepage, not
// just another item alongside ordinary resource cards.
function CollectionCard({ title, author, count, coverUrl, onClick }) {
  const [bgGradient, setBgGradient] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (coverUrl) {
      extractAccentColorMixedWithBlack(coverUrl).then((gradient) => {
        if (!cancelled) setBgGradient(gradient)
      })
    } else {
      setBgGradient(null)
    }
    return () => { cancelled = true }
  }, [coverUrl])

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden border border-outline flex items-center gap-4 p-3 text-left active:scale-[0.98] transition-transform"
      style={{ background: bgGradient || '#1A1412' }}
    >
      <div className="w-16 h-16 flex-none rounded-xl overflow-hidden bg-black/30 border border-white/10">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white/70 text-2xl">library_books</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-grow">
        <p className="font-body-md text-body-md font-bold text-white truncate">{title}</p>
        {author && <p className="font-label-sm text-label-sm text-white/70 truncate">{author}</p>}
        {typeof count === 'number' && (
          <p className="font-label-sm text-label-sm text-white/50">
            {count} resource{count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <span className="material-symbols-outlined text-white/60 flex-none">chevron_right</span>
    </button>
  )
}

export default CollectionCard