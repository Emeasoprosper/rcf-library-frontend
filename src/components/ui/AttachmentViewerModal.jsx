// components/ui/AttachmentViewerModal.jsx
// Opens a notification/announcement's attachment INSIDE the app — never
// navigates to another tab or site. Currently handles images (the only
// attachment type the backend accepts today, sent as a data: URL). PDFs/
// docs aren't supported yet because AdminAnnouncements.jsx doesn't upload
// them anywhere — see note in the chat reply.
function AttachmentViewerModal({ open, onClose, title, url }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full max-h-[85vh] bg-surface-container rounded-2xl overflow-hidden border border-outline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline">
          <p className="font-label-md text-label-md font-semibold text-on-surface truncate pr-2">{title}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex-none rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface text-[20px]">close</span>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/20">
          {url ? (
            <img src={url} alt={title} className="max-w-full max-h-[70vh] object-contain" />
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-lg">No attachment.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttachmentViewerModal