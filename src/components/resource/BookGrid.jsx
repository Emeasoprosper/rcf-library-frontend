import { getMediaKind, MEDIA_KIND_STYLE } from '../../lib/mediaKind'

function BookGrid({ title, items, onSeeAll, variant = 'default' }) {
  if (!items || items.length === 0) return null

  const isCompact = variant === 'compact'

  return (
    <section className="mb-stack-lg">
      <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
        <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-label-md font-label-md text-on-surface-variant hover:text-primary">
            See All
          </button>
        )}
      </div>
      <div className={`grid px-margin-mobile ${isCompact ? 'grid-cols-3 gap-stack-sm' : 'grid-cols-2 gap-gutter'}`}>
        {items.map((book) => {
          const kind = getMediaKind(book.fileType)
          const style = MEDIA_KIND_STYLE[kind]

          return (
            <div key={book.id || book.title} onClick={book.onClick} className="group cursor-pointer min-w-0">
              <div
                className={`border border-outline overflow-hidden transition-all group-hover:border-on-surface-variant ${
                  isCompact ? 'rounded-lg mb-1.5' : 'rounded-xl mb-stack-sm'
                }`}
              >
                <div className={`relative ${style.aspect} w-full bg-surface-container`}>
                  {book.thumbnailUrl ? (
                    <img
                      src={book.thumbnailUrl}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`material-symbols-outlined text-on-surface-variant ${isCompact ? 'text-xl' : 'text-3xl'}`}>
                        {book.thumbnailStatus === 'processing' ? 'hourglass_top' : style.gridIcon}
                      </span>
                    </div>
                  )}
                  {kind === 'video' && book.thumbnailUrl && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className={`${isCompact ? 'w-7 h-7' : 'w-10 h-10'} rounded-full bg-black/50 flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-white">play_arrow</span>
                      </span>
                    </span>
                  )}

                </div>

                <div className={`bg-surface-container-high min-w-0 ${isCompact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}>
                  <h4 className={`font-label-md font-bold text-on-surface truncate ${isCompact ? 'text-label-sm' : 'text-label-md'}`}>
                    {book.title}
                  </h4>
                  {!isCompact && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{book.author}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BookGrid