// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/NewsPopupModal.jsx
// Two render modes based on news.popup_style:
//  - 'image_only': just the image, transparent bg, no card/border — tap
//    it (or the X) to close/open. Clicking the image navigates to the
//    full detail page via onViewAll.
//  - 'rich' (default): existing card with title + message + optional
//    attachment, "Read Full Detail" button navigates to the detail page.
function NewsPopupModal({ news, onClose, onViewAll }) {
  if (!news) return null

  const categoryLabel = news.type === 'announcement' ? 'Announcement' : 'News'
  const isImage = news.attachment_mime ? news.attachment_mime.startsWith('image/') : true
  const isImageOnlyPopup = news.popup_style === 'image_only' && news.attachment_url && isImage

  if (isImageOnlyPopup) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-margin-mobile bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="relative max-w-sm w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-2 -right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/55 backdrop-blur-sm text-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <img
            src={news.attachment_url}
            alt=""
            onClick={onViewAll}
            className="max-w-full max-h-[75vh] w-auto h-auto object-contain cursor-pointer"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-margin-mobile bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[85vh] flex flex-col bg-surface-container border border-outline rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/55 backdrop-blur-sm text-white active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>

        <div className="overflow-y-auto">
          {news.attachment_url && isImage && (
            <div className="w-full bg-surface-container-lowest">
              <img
                src={news.attachment_url}
                alt=""
                className="w-full h-auto max-h-[50vh] object-contain"
              />
            </div>
          )}

          <div className="p-stack-lg">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide">
              {categoryLabel}
            </span>

            <h2 className="font-headline-md text-headline-md font-display text-on-surface mt-1 mb-2">
              {news.title}
            </h2>

            <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
              {news.message}
            </p>
          </div>
        </div>

        {onViewAll && (
          <div className="flex-none p-stack-lg pt-stack-md bg-gradient-to-t from-orange-500/15 via-transparent to-transparent">
            <button
              onClick={onViewAll}
              className="w-full py-3.5 rounded-lg font-label-md text-label-md font-semibold bg-orange-500 text-white active:scale-[0.98] transition-transform"
            >
              Read Full Detail
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsPopupModal