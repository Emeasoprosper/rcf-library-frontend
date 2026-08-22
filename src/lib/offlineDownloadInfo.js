// lib/offlineDownloadInfo.js
//
// Tracks whether the user has ever seen the one-time explanation that
// downloaded materials are saved inside the app's own offline storage
// (see offlineStorage.js) rather than the phone's normal Downloads/File
// Manager. A single boolean flag — not a per-item list like
// dismissedNews.js — because this explanation only needs to be shown
// once ever, regardless of how many different resources get downloaded.

const KEY = 'rcf_seen_offline_download_info'

export function hasSeenOfflineDownloadInfo() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markOfflineDownloadInfoSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // Non-fatal — worst case the popup shows again next download.
  }
}