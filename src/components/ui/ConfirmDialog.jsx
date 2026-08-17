function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-margin-mobile"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm bg-surface-container-high border border-outline rounded-2xl p-stack-lg mb-6 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headline-lg text-headline-lg font-display text-on-surface mb-2">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 h-11 rounded-full font-label-md font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 h-11 rounded-full font-label-md font-semibold transition-colors ${
              danger ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-primary text-on-primary hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog