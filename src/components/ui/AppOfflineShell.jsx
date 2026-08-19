// components/ui/AppOfflineShell.jsx
//
// Shown ONLY when isRunningAsInstalledApp() is true AND the device is
// offline (see AppLoader.jsx). Unlike the plain website's full-page "No
// Internet Connection" screen, this keeps the app's own top/bottom
// navigation visible and pulls the real downloaded-resource count and
// first cover straight from IndexedDB via offlineStorage.js — no
// network request, no fake numbers.
//
// FIX 1 (broken thumbnail icon): resources downloaded BEFORE the
// thumbnail-embedding fix in offlineStorage.js still have their old
// metadata sitting in IndexedDB with `thumbnail` set to a raw remote
// URL, not a local data URL. With zero network that remote URL can't
// load, producing the browser's native broken-image icon — and
// onError doesn't reliably catch every failure mode across browsers.
// isLocalImage() below only trusts values that are actually data: URLs
// (the only kind offlineStorage.js produces going forward) and treats
// anything else as "no thumbnail" up front, so old stale entries fall
// back to the wifi_off icon instead of ever attempting to load a dead
// remote URL. Existing downloads made before this fix will show the
// fallback icon until the person re-downloads them — there's no way to
// retroactively fix already-stored bad data without a migration, which
// is out of scope here.
//
// FIX 2 (Continue to Downloads not working): this component now takes
// an onContinue prop, called before navigating — see AppLoader.jsx for
// why this is required for the navigation to actually take effect.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../layout/TopAppBar'
import BottomNav from '../layout/BottomNav'
import { listDownloads } from '../../lib/offlineStorage'

function isLocalImage(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

function AppOfflineShell({ onContinue }) {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState(null) // null = still loading
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    listDownloads()
      .then((items) => { if (!cancelled) setDownloads(items) })
      .catch(() => { if (!cancelled) setDownloads([]) })
    return () => { cancelled = true }
  }, [])

  const count = downloads?.length ?? 0
  const rawFirstCover = downloads?.[0]?.thumbnail || null
  const showCover = isLocalImage(rawFirstCover) && !imgFailed
  const countLabel =
    downloads === null
      ? '' // still reading local storage, avoid a flash of "0"
      : count === 0
      ? 'No downloaded resources yet'
      : count === 1
      ? '1 resource available offline'
      : `${count} resources available offline`

  const handleContinue = () => {
    onContinue?.()
    navigate('/downloads')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar title="Offline" />

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile pt-[68px] pb-24 text-center gap-stack-md">
        {showCover ? (
          <div className="w-32 h-44 rounded-xl overflow-hidden border border-outline shadow-lg mb-stack-sm">
            <img
              src={rawFirstCover}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
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
          onClick={handleContinue}
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