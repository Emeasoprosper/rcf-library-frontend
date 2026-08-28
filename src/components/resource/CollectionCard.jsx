// components/resource/CollectionCard.jsx
//
// Homepage/Search summary card for a resource_collections entry (NOT the
// personal bookmark-folder feature — confirmed unused there, safe to
// design purely around the public collection shape: cover, title,
// author, resource count).
function CollectionCard({ title, author, count, coverUrl, onClick }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 w-40 group text-left active:scale-[0.98] transition-transform">
      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-surface-container-high border border-outline mb-2">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">library_books</span>
          </span>
        )}
        {/* Corner badge signals "this is a group, not a single file" —
            addresses the spec's requirement that a collection card never
            reads as an ordinary resource card at a glance. */}
        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[14px]">library_books</span>
        </span>
      </div>
      <p className="font-body-md text-body-md font-semibold text-on-surface truncate group-hover:underline">
        {title}
      </p>
      {author && (
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{author}</p>
      )}
      {typeof count === 'number' && (
        <p className="font-label-sm text-label-sm text-on-surface-variant/70">
          {count} resource{count !== 1 ? 's' : ''}
        </p>
      )}
    </button>
  )
}

export default CollectionCard