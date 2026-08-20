// hooks/useThumbnailPolling.js
//
// ROOT CAUSE FIX for "real preview during upload, but a blank/generic
// placeholder afterward everywhere the resource is listed" — across
// MyContributions, AdminResources, AdminUploads, Library, Home, Search,
// and anywhere else that renders thumbnail_url/thumbnail_status.
//
// The actual preview (real PDF page-1 render, ffmpeg video frame, audio
// artwork, or the generated fallback cover) is produced by a
// fire-and-forget background job on the backend (queuePreviewGeneration
// in uploads.js) — the upload HTTP response returns immediately, well
// before that job finishes. Every list page was fetching its data ONCE
// on mount and never again, so whatever thumbnail_status existed at
// that exact moment (usually 'pending' or 'processing') is what stayed
// on screen forever, even after the backend successfully finished and
// saved a real thumbnail seconds later.
//
// This hook re-runs a provided fetch function on an interval, but ONLY
// while at least one item in the current list is still
// pending/processing — and stops automatically once every item has
// settled to 'ready' or 'unavailable', so this never polls forever or
// wastes requests on a page full of already-finished resources.
import { useEffect, useRef } from 'react'

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 30 // ~2 minutes ceiling — a real preview job
// that hasn't finished by then is treated as stuck rather than polled
// forever; the item just keeps showing its placeholder until the next
// manual refresh/reload.

function hasUnsettledThumbnail(items, statusKey) {
  return items.some((item) => {
    const status = item[statusKey]
    return status === 'pending' || status === 'processing'
  })
}

// refetchFn: () => Promise<void> — should re-run the same fetch the
// page already uses and call its own setState with the fresh result.
// items: the current list currently being rendered.
// statusKey: the property name holding the status string — defaults to
// 'thumbnail_status' to match the API's actual field name.
export function useThumbnailPolling(items, refetchFn, statusKey = 'thumbnail_status') {
  const attemptsRef = useRef(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    if (!hasUnsettledThumbnail(itemsRef.current, statusKey)) {
      attemptsRef.current = 0
      return
    }

    const interval = setInterval(() => {
      attemptsRef.current += 1
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(interval)
        return
      }
      if (!hasUnsettledThumbnail(itemsRef.current, statusKey)) {
        clearInterval(interval)
        return
      }
      refetchFn()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
    // Re-arms whenever the list identity changes (new fetch resolved) —
    // intentionally NOT depending on refetchFn directly to avoid
    // re-creating the interval every render if the caller doesn't
    // memoize it with useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, statusKey])
}