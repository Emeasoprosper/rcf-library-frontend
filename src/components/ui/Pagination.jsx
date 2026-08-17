function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-stack-md">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg font-label-sm text-label-sm ${
          page === 1
            ? 'text-on-surface-variant opacity-40 cursor-not-allowed'
            : 'text-on-surface hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        Prev
      </button>

      <span className="font-label-sm text-label-sm text-on-surface-variant">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg font-label-sm text-label-sm ${
          page === totalPages
            ? 'text-on-surface-variant opacity-40 cursor-not-allowed'
            : 'text-on-surface hover:bg-surface-container-high'
        }`}
      >
        Next
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  )
}

export default Pagination
