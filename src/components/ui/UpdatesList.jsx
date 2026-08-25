import StackedPreview from './StackedPreview'

function UpdatesList({ updates, onSeeAll, onDelete }) {
  if (!updates || updates.length === 0) return null

  return (
    <section className="mb-stack-lg">
      <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
        <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">Updates</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-label-md font-label-md text-on-surface-variant hover:text-primary">
            View all
          </button>
        )}
      </div>
      <div className="px-margin-mobile flex flex-col gap-3">
        {updates.map((update) => (
          <div key={update.id} className="flex items-center gap-2 group">
            <div
              onClick={update.onClick}
              className="flex items-center gap-4 flex-grow min-w-0 cursor-pointer"
            >
              <StackedPreview
                id={update.id}
                thumbnailUrl={update.thumbnailUrl}
                icon={update.previewIcon}
                count={update.count}
                size={48}
              />
              <div className="flex-grow min-w-0">
                <p className={`font-label-md text-label-md truncate break-words ${update.read ? 'text-on-surface-variant' : 'text-on-surface font-bold'}`}>
                  {update.text}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{update.time}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant flex-none group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(update.id)
                }}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-red-500/10 hover:text-red-400 transition-colors flex-none"
                aria-label="Delete notification"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default UpdatesList