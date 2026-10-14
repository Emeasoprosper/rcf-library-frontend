// Loading skeletons shaped like the real pages (mobile + desktop), so the
// screen keeps its layout while data loads. Blocks never get an
// "absolute" class themselves (the shimmer needs position: relative), so
// positioned pieces are wrapped in a div instead.

function SkeletonStyles() {
  return (
    <style>{`
      .sk-shimmer { position: relative; overflow: hidden; }
      .sk-shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
        animation: sk-shimmer-sweep 1.6s ease-in-out infinite;
      }
      @keyframes sk-shimmer-sweep { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .sk-shimmer::after { animation: none; } }
    `}</style>
  )
}

function Block({ className = '' }) {
  return <div className={`sk-shimmer bg-surface-container-high rounded ${className}`} />
}

function RailSkeleton({ titleWidth, cardWidth, cardAspect, count = 4 }) {
  return (
    <section className="mb-stack-lg">
      <div className="px-margin-mobile mb-stack-sm">
        <Block className={`h-6 ${titleWidth}`} />
      </div>
      <div className="flex gap-gutter overflow-hidden px-margin-mobile">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`flex-none ${cardWidth}`}>
            <Block className={`${cardAspect} w-full rounded-xl mb-stack-sm`} />
            <Block className="h-4 w-full mb-1" />
            <Block className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  )
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline mb-2">
      <Block className="w-14 h-14 flex-none rounded-lg" />
      <div className="flex-grow min-w-0">
        <Block className="h-4 w-3/4 mb-1.5" />
        <Block className="h-3 w-1/3 mb-1.5" />
        <Block className="h-3 w-1/2" />
      </div>
      <Block className="w-9 h-9 flex-none rounded-full" />
    </div>
  )
}

export function CollectionSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pl-80 lg:pr-80" aria-hidden="true">
      <SkeletonStyles />
      <div className="fixed top-0 left-0 z-40 w-full px-margin-mobile py-stack-md bg-surface/80 backdrop-blur-md border-b border-outline md:hidden">
        <div className="flex items-center gap-3">
          <Block className="w-9 h-9 flex-none rounded-full" />
          <Block className="h-5 w-40" />
        </div>
      </div>

      <div className="pt-[68px] md:pt-24">
        <section className="px-margin-mobile pt-stack-lg pb-stack-md flex flex-col items-center">
          <Block className="w-40 h-40 md:w-48 md:h-48 rounded-xl mb-stack-md" />
          <Block className="h-6 w-56 mb-2" />
          <Block className="h-4 w-32 mb-2" />
          <Block className="h-3 w-24" />
        </section>

        <div className="flex gap-6 border-b border-outline px-margin-mobile pt-1 pb-3">
          <Block className="h-4 w-16" />
          <Block className="h-4 w-12" />
          <Block className="h-4 w-24" />
        </div>

        <div className="px-margin-mobile pt-stack-md">
          <Block className="h-6 w-32 mb-stack-sm" />
          {Array.from({ length: 5 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResourceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-32 md:pt-24 md:pl-80 lg:pr-80" aria-hidden="true">
      <SkeletonStyles />

      <div className="relative w-full h-[52vh] min-h-[360px] overflow-hidden bg-surface-container-highest">
        <div className="absolute inset-0">
          <Block className="w-full h-full rounded-none" />
        </div>
        <div className="absolute top-6 left-4">
          <Block className="w-10 h-10 rounded-full" />
        </div>
        <div className="absolute top-6 right-4 flex gap-2">
          <Block className="w-10 h-10 rounded-full" />
          <Block className="w-10 h-10 rounded-full" />
        </div>
      </div>

      <div className="px-margin-mobile -mt-16 relative z-10">
        <Block className="h-4 w-32 mb-3" />
        <Block className="h-8 w-3/4 mb-2" />
        <Block className="h-8 w-1/2 mb-4" />
        <Block className="h-4 w-full mb-2" />
        <Block className="h-4 w-11/12 mb-2" />
        <Block className="h-4 w-2/3 mb-4" />
        <div className="flex flex-wrap gap-2 mb-5">
          <Block className="h-8 w-24 rounded-full" />
          <Block className="h-8 w-28 rounded-full" />
          <Block className="h-8 w-20 rounded-full" />
        </div>
        <div className="flex gap-5 mb-8">
          <Block className="h-4 w-24" />
          <Block className="h-4 w-20" />
        </div>
        <div className="-mx-margin-mobile">
          <RailSkeleton titleWidth="w-40" cardWidth="w-28" cardAspect="aspect-[2/3]" count={4} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-80 lg:right-80 z-30 px-margin-mobile py-4 bg-background border-t border-outline flex gap-3">
        <Block className="flex-1 h-14 rounded-full" />
        <Block className="w-14 h-14 flex-none rounded-full" />
      </div>
    </div>
  )
}

export function NotificationsSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-gutter" aria-hidden="true">
      <SkeletonStyles />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-stack-md rounded-xl bg-surface-container border border-outline">
          <Block className="w-6 h-6 flex-none rounded-full mt-0.5" />
          <div className="flex-grow min-w-0">
            <Block className="h-4 w-4/5 mb-2" />
            <Block className="h-3 w-full mb-1.5" />
            <Block className="h-3 w-1/3" />
          </div>
          <Block className="w-[18px] h-[18px] flex-none rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function HomeContentSkeleton() {
  return (
    <div aria-hidden="true">
      <SkeletonStyles />
      <section className="mb-stack-lg">
        <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
          <Block className="h-6 w-20" />
          <Block className="h-4 w-14" />
        </div>
        <div className="px-margin-mobile">
          <Block className="aspect-[16/7] w-full rounded-2xl" />
        </div>
      </section>

      <RailSkeleton titleWidth="w-44" cardWidth="w-40" cardAspect="aspect-video" count={3} />
      <RailSkeleton titleWidth="w-52" cardWidth="w-28" cardAspect="aspect-[2/3]" count={4} />

      <section className="mb-stack-lg">
        <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
          <Block className="h-6 w-44" />
          <Block className="h-4 w-14" />
        </div>
        <div className="grid grid-cols-3 gap-stack-sm px-margin-mobile">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Block className="aspect-[2/3] w-full rounded-lg mb-1.5" />
              <Block className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}