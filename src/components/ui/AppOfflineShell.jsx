// components/ui/AppOfflineShell.jsx
//
// Shown ONLY when isRunningAsInstalledApp() is true AND the device is
// offline (see AppLoader.jsx). Unlike the plain website's full-page "No
// Internet Connection" screen, this keeps the app's own top/bottom
// navigation visible and pulls the real downloaded-resource count and
// first cover straight from IndexedDB via offlineStorage.js — no
// network request, no fake numbers. If listDownloads() ever returns
// fewer usable entries than expected (a corrupted blob, etc.), the
// count shown is whatever it actually returns — never a hardcoded or
// assumed value.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../layout/TopAppBar'
import BottomNav from '../layout/BottomNav'
import { listDownloads } from '../../lib/offlineStorage'

function AppOfflineShell() {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState(null) // null = still loading

  useEffect(() => {
    let cancelled = false
    listDownloads()
      .then((items) => { if (!cancelled) setDownloads(items) })
      .catch(() => { if (!cancelled) setDownloads([]) })
    return () => { cancelled = true }
  }, [])

  const count = downloads?.length ?? 0
  const firstCover = downloads?.[0]?.thumbnail || null
  const countLabel =
    downloads === null
      ? '' // still reading local storage, avoid a flash of "0"
      : count === 0
      ? 'No downloaded resources yet'
      : count === 1
      ? '1 resource available offline'
      : `${count} resources available offline`

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar title="Offline" />

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile pt-[68px] pb-24 text-center gap-stack-md">
        {firstCover ? (
          <div className="w-32 h-44 rounded-xl overflow-hidden border border-outline shadow-lg mb-stack-sm">
            <img src={firstCover} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-stack-sm">
            wifi_off
          </span>
        )}

        <div className="flex flex-col gap-1 max-w-xs">
          <h1 className="font-headline-md text-headline-md font-display text-on-surface">
            You're Offline
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            You can still access materials you've already downloaded.
          </p>
        </div>

        {countLabel && (
          <p className="font-label-md text-label-md text-on-surface-variant">
            {countLabel}
          </p>
        )}

        <button
          onClick={() => navigate('/downloads')}
          className="mt-stack-sm px-6 h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
        >
          {count > 0 ? 'Continue to Downloads' : 'Go to Downloads'}
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

export default AppOfflineShell