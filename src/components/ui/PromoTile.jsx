function PromoTile({ title, tag, icon = 'auto_stories', image, gradient = 'from-slate-700 to-slate-900', onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-xl h-40 flex flex-col justify-start text-left border border-outline hover:border-on-surface-variant transition-colors isolate"
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover -z-10"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 -z-10" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} -z-10`} />
      )}

      <div className="p-stack-md relative z-10">
        <h3 className="font-headline-md text-headline-md font-bold text-white leading-tight whitespace-pre-line drop-shadow-sm">
          {title}
        </h3>
      </div>

      <div
        className="absolute -bottom-3 -right-3 w-24 h-28 rounded-lg bg-surface-container-lowest border border-outline shadow-xl flex items-center justify-center"
        style={{ transform: 'rotate(-8deg)' }}
      >
        <span className="material-symbols-outlined text-on-background text-3xl">{icon}</span>
        {tag && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm whitespace-nowrap shadow-md">
            {tag}
          </span>
        )}
      </div>
    </button>
  )
}

export default PromoTile