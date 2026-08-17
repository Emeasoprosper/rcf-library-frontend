import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SplashLight from '../../assets/SplahLightMode.svg'
import SplashDark from '../../assets/SplashDarkMode.svg'

// Full-app boot gate. Sits inside AuthProvider (see App.jsx) so it can
// read the real auth-check-in-flight signal instead of inventing its own
// "is the app ready" heuristic. Two states block rendering the app:
//
//  1. Offline — navigator.onLine + the online/offline window events.
//     Shows a dedicated "no connection" screen with a reload button.
//  2. Not ready — AuthContext's `loading` (the initial authApi.me()
//     check hasn't resolved yet). Renders a Home-shaped skeleton with a
//     shimmer sweep instead of a bare spinner.
//
// Skeleton shapes are matched against the real TopAppBar/HorizontalRail/
// BookGrid source. One thing NOT verified: lib/mediaKind.js's exact
// aspect ratios per kind (video/audio/book) — the video=aspect-video,
// book=aspect-[2/3], audio=aspect-square assumption below is inferred
// from how Home.jsx filters each rail to a single kind, not confirmed
// against mediaKind.js directly.

function ShimmerStyles() {
  return (
    <style>{`
      .app-loader-shimmer {
        position: relative;
        overflow: hidden;
      }
      .app-loader-shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
        animation: app-loader-shimmer-sweep 1.6s ease-in-out infinite;
      }
      @keyframes app-loader-shimmer-sweep {
        100% { transform: translateX(100%); }
      }
    `}</style>
  )
}

function Block({ className = '' }) {
  return <div className={`app-loader-shimmer bg-surface-container-high rounded ${className}`} />
}

// One rail's worth of skeleton cards. aspect/width vary per kind so the
// three rails don't look identical, matching how Continue Watching
// (video), Popular (books), New Audio are each single-kind on Home.jsx.
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

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <ShimmerStyles />

      {/* TopAppBar — fixed bar with avatar circle + title on the left,
          matching the real component's actual structure. */}
      <div className="fixed top-0 left-0 z-50 w-full px-margin-mobile py-stack-md bg-surface/80 backdrop-blur-md border-b border-outline">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Block className="w-9 h-9 rounded-full" />
            <Block className="h-5 w-20" />
          </div>
          <Block className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* pt-[68px] offset matches Home.jsx's own <main> padding under
          the fixed TopAppBar. */}
      <div className="pt-[68px]">
        <div className="pt-stack-md px-margin-mobile">
          {/* Search bar */}
          <Block className="h-12 w-full rounded-full mb-stack-lg" />

          {/* Categories row */}
          <div className="flex justify-between items-end mb-stack-sm">
            <Block className="h-6 w-28" />
            <Block className="h-5 w-14" />
          </div>
          <div className="flex gap-stack-sm mb-stack-lg overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Block key={i} className="h-9 w-24 flex-none rounded-full" />
            ))}
          </div>
        </div>

        {/* Continue Watching-shaped rail — video kind, wide cards */}
        <RailSkeleton titleWidth="w-44" cardWidth="w-40" cardAspect="aspect-video" count={3} />

        {/* Popular-shaped rail — book kind, portrait cards */}
        <RailSkeleton titleWidth="w-52" cardWidth="w-24" cardAspect="aspect-[2/3]" count={4} />

        {/* New Audio-shaped rail — audio kind, square cards */}
        <RailSkeleton titleWidth="w-32" cardWidth="w-28" cardAspect="aspect-square" count={4} />

        {/* Recently Added grid — BookGrid compact variant: rounded-lg,
            single text line only (author line hidden in compact). */}
        <section className="mb-stack-lg">
          <div className="px-margin-mobile flex justify-between items-end mb-stack-sm">
            <Block className="h-6 w-44" />
            <Block className="h-5 w-14" />
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

      {/* BottomNav approximation — not verified against real BottomNav.jsx */}
      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-outline bg-background flex items-center justify-around px-margin-mobile">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-6 w-6 rounded-full" />
        ))}
      </div>
    </div>
  )
}

function AppLoader({ children }) {
  const { loading: authLoading } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    function handleOnline() { setIsOnline(true) }
    function handleOffline() { setIsOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 600)
    return () => clearTimeout(timer)
  }, [])

  if (!isOnline) {
    return (
      <main className="flex flex-col min-h-screen w-full px-margin-mobile items-center justify-center gap-stack-md bg-surface-container-lowest text-on-surface text-center">
        <img src={SplashLight} alt="" className="w-40 h-40 dark:hidden opacity-60" />
        <img src={SplashDark} alt="" className="w-40 h-40 hidden dark:block opacity-60" />
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">wifi_off</span>
        <div className="flex flex-col gap-stack-sm max-w-xs">
          <h1 className="font-headline-md text-headline-md font-display text-on-surface">
            No Internet Connection
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Check your Wi-Fi or mobile data, then try again.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-stack-sm px-6 py-3 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all"
        >
          Reload
        </button>
      </main>
    )
  }

  if (authLoading || !minTimeElapsed) {
    return <HomeSkeleton />
  }

  return children
}

export default AppLoader