function AdvertBanner({ ads }) {
  if (!ads || ads.length === 0) return null

  const ad = ads[0]

  return (
    <section className="mb-stack-lg px-margin-mobile">
      <div className="rounded-xl border border-outline bg-surface-container p-stack-md flex items-center gap-4">
        <div className="w-14 h-14 flex-none rounded-lg bg-surface-container-highest border border-outline flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant">campaign</span>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-headline-md text-headline-md text-on-surface truncate">{ad.title}</h3>
          <p className="font-label-md text-label-md text-on-surface-variant truncate">{ad.description}</p>
        </div>
      </div>
    </section>
  )
}

export default AdvertBanner
