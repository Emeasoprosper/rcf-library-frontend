// components/ui/OfflineDownloadInfoModal.jsx
//
// One-time popup shown right after a download actually succeeds —
// explains the file is saved inside the app's own offline storage, not
// the phone's normal Downloads/File Manager, so it won't show up there.
// Visual pattern matches DownloadGateModal.jsx exactly (same overlay,
// card, and button classes) so it feels like part of the same system
// rather than a new one-off design.
function OfflineDownloadInfoModal({ open, onClose, onViewOffline }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline p-stack-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-symbols-outlined text-primary text-4xl mb-stack-sm">download_done</span>
        <h3 className="font-headline-sm text-headline-sm font-display text-on-surface mb-1">
          Saved for Offline Reading
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
          This material is now saved inside the app for offline access. It won't appear in your phone's normal
          Downloads or File Manager — the app manages it internally so it still works with no internet connection.
        </p>
        <div className="flex flex-col gap-2">
          {onViewOffline && (
            <button
              onClick={onViewOffline}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg"
            >
              View Offline Materials
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-12 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfflineDownloadInfoModal