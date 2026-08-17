const statusConfig = {
  approved: { icon: 'check_circle', label: 'Approved' },
  pending: { icon: 'schedule', label: 'Pending' },
  reviewing: { icon: 'visibility', label: 'Reviewing' },
  rejected: { icon: 'cancel', label: 'Rejected' },
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-outline text-on-surface-variant text-[11px] font-label-sm uppercase tracking-wider">
      <span className="material-symbols-outlined text-[13px]">{config.icon}</span>
      {config.label}
    </span>
  )
}

export default StatusBadge
