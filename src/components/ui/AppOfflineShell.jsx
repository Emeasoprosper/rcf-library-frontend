// components/ui/AppOfflineShell.jsx
//
// Shown ONLY when isRunningAsInstalledApp() is true AND the device is
// offline (see AppLoader.jsx). Unlike the plain website's full-page "No
// Internet Connection" screen, this keeps the app's own top/bottom
// navigation visible and pulls the real downloaded-resource count and
// first cover straight from IndexedDB via offlineStorage.js — no
// network request, no fake numbers.
//
// FIX 1 (broken thumbnail icon): only trusts actual data: URLs as
// thumbnails — see isLocalImage() below. Resources downloaded before
// the thumbnail-embedding fix in offlineStorage.js still have a stale
// remote URL stored; those fall back to the wifi_off icon instead of
// attempting a dead network request.
//
// FIX 2 (v2 — Continue to Downloads landing on Home instead of
// Downloads): this component no longer calls navigate() itself. It
// only calls onContinue() and lets AppLoader.jsx handle the actual
// navigation, from a useEffect that fires strictly after AppRoutes has
// mounted. Calling navigate() directly from here raced against that
// mount and landed on the wrong route — see AppLoader.jsx for the full
// explanation.
import { useState, useEffect } from 'react'
import TopAppBar from '../layout/TopAppBar'
import BottomNav from '../layout/BottomNav'
import { listDownloads } from '../../lib/offlineStorage'
import StackedPreview from './StackedPreview'

function isLocalImage(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

function AppOfflineShell({ onContinue }) {
  const [downloads, setDownloads] = useState(null) // null = still loading

  useEffect(() => {
    let cancelled = false
    listDownloads()
      .then((items) => { if (!cancelled) setDownloads(items) })
      .catch(() => { if (!cancelled) setDownloads([]) })
    return () => { cancelled = true }
  }, [])

  const count = downloads?.length ?? 0
  // First up to 3 downloads, front-most first — StackedPreview shows one
  // real fanned card per entry (1 download = 1 card, 2 = 2, 3+ = 3, per
  // the design you asked for). Entries without a valid local thumbnail
  // fall back to the icon on that layer inside StackedPreview itself.
  const previewThumbnails = (downloads || [])
    .slice(0, 3)
    .map((d) => (isLocalImage(d.thumbnail) ? d.thumbnail : null))
  const countLabel =
    downloads === null
      ? ''
      : count === 0
      ? 'No downloaded resources yet'
      : count === 1
      ? '1 resource available offline'
      : `${count} resources available offline`

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar title="Offline" />

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile pt-[68px] pb-24 text-center gap-stack-md">
        <div className="mb-stack-sm">
          <StackedPreview thumbnails={previewThumbnails} icon="wifi_off" width={128} height={176} />
        </div>

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
          onClick={() => onContinue?.()}
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