import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SplashLight from '../../assets/SplahLightMode.svg'
import SplashDark from '../../assets/SplashDarkMode.svg'
import AppOfflineShell from './AppOfflineShell'
import { isRunningAsInstalledApp } from '../../lib/pwaInstall'

// Full-app boot gate. Sits inside AuthProvider (see App.jsx) so it can
// read the real auth-check-in-flight signal instead of inventing its own
// "is the app ready" heuristic. Two states block rendering the app:
//
//  1. Offline — navigator.onLine + the online/offline window events.
//     - Plain website (isRunningAsInstalledApp() false): full-page "no
//       connection" screen with a reload button, same as before.
//     - Installed app (TWA/PWA, isRunningAsInstalledApp() true): renders
//       AppOfflineShell instead — keeps top/bottom nav visible, offers a
//       real "Continue to Downloads" path.
//
//       FIX (v2 — race condition): the previous version called
//       navigate('/downloads') directly inside AppOfflineShell's click
//       handler, in the SAME synchronous function as the state update
//       that swaps AppOfflineShell out for AppRoutes. At the moment
//       navigate() ran, AppRoutes hadn't actually mounted yet — the
//       navigation landed on a router tree that wasn't fully swapped
//       in, and the app ended up on whatever the default/root route
//       resolved to (Home) instead of /downloads. Now the navigation
//       itself lives here, in a useEffect keyed on bypassOfflineShell —
//       guaranteeing AppRoutes has actually mounted and is listening
//       for the location change before navigate() ever fires.
//  2. Not ready — AuthContext's `loading` (the initial authApi.me()
//     check hasn't resolved yet). Renders a Home-shaped skeleton with a
//     shimmer sweep instead of a bare spinner.

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

      <div className="fixed top-0 left-0 z-50 w-full px-margin-mobile py-stack-md bg-surface/80 backdrop-blur-md border-b border-outline">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Block className="w-9 h-9 rounded-full" />
            <Block className="h-5 w-20" />
          </div>
          <Block className="h-9 w-9 rounded-full" />
        </div>
      </div>

      <div className="pt-[68px]">
        <div className="pt-stack-md px-margin-mobile">
          <Block className="h-12 w-full rounded-full mb-stack-lg" />

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

        <RailSkeleton titleWidth="w-44" cardWidth="w-40" cardAspect="aspect-video" count={3} />
        <RailSkeleton titleWidth="w-52" cardWidth="w-24" cardAspect="aspect-[2/3]" count={4} />
        <RailSkeleton titleWidth="w-32" cardWidth="w-28" cardAspect="aspect-square" count={4} />

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
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [bypassOfflineShell, setBypassOfflineShell] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      setBypassOfflineShell(false)
    }
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

  // Fires strictly AFTER bypassOfflineShell flips true and this
  // component has re-rendered past the block below — meaning AppRoutes
  // is already mounted and its own useNavigate() context is live by the
  // time this runs. This is what actually fixes the "lands on Home
  // instead of Downloads" bug.
  useEffect(() => {
    if (bypassOfflineShell) {
      navigate('/downloads')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypassOfflineShell])

  if (!isOnline && !bypassOfflineShell) {
    if (isRunningAsInstalledApp()) {
      return <AppOfflineShell onContinue={() => setBypassOfflineShell(true)} />
    }

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