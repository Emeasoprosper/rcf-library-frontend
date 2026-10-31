// RCFMOUAULIBRARYreact/student-dashboard/src/lib/downloadFx.js
// Shared download experience for every "Download for offline" button.
// <DownloadFx /> (mounted once in App) does the drawing; pages just call:
//   if (!(await confirmOfflineDownload())) return   // before fetching
//   playDownloadSaved({ from: button, title })      // after saveOffline()
import { hasSeenOfflineDownloadInfo, markOfflineDownloadInfoSeen } from './offlineDownloadInfo'

export const NOTICE_EVENT = 'rcf:download-notice'
export const SAVED_EVENT = 'rcf:download-saved'

// First download ever: explain where files go (inside the app, not the
// phone's Downloads) and let them continue or cancel. Afterwards resolves
// straight away with true.
export function confirmOfflineDownload() {
  if (hasSeenOfflineDownloadInfo()) return Promise.resolve(true)
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(NOTICE_EVENT, {
        detail: {
          resolve: (ok) => {
            if (ok) markOfflineDownloadInfoSeen()
            resolve(ok)
          },
        },
      })
    )
  })
}

// The book flies from the button (an element, a click event or a DOMRect)
// into the safe. Without a starting point it rises from the screen centre.
export function playDownloadSaved({ from = null, title = '' } = {}) {
  const el = from?.currentTarget || from
  const rect = typeof el?.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : el?.width ? el : null
  window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: { rect, title } }))
}
