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

function CollectionCard({ name, count, icons, onClick }) {
  if (!name) {
    return (
      <button onClick={onClick} className="flex-shrink-0 w-48 group text-left">
        <div className="h-32 w-full border-2 border-dashed border-outline rounded-xl flex items-center justify-center hover:border-primary transition-colors mb-3">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
            create_new_folder
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface">New Collection</p>
      </button>
    )
  }

  return (
    <button onClick={onClick} className="flex-shrink-0 w-48 group text-left">
      <div className="h-32 w-full bg-surface-container-high border border-outline rounded-xl overflow-hidden mb-3 grid grid-cols-2 grid-rows-2 gap-px">
        {icons.slice(0, 4).map((cat, i) => (
          <div key={i} className="bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              {categoryIcons[cat] || categoryIcons.default}
            </span>
          </div>
        ))}
      </div>
      <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{name}</p>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{count} items</p>
    </button>
  )
}

export default CollectionCard
