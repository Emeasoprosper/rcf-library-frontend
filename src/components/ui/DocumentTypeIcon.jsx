function DocumentTypeIcon({ color = '#4285F4', className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M14 4 H40 L50 14 V60 H14 Z" fill={color} />
      <path d="M40 4 L50 14 H40 Z" fill="rgba(0,0,0,0.28)" />
      <rect x="22" y="27" width="20" height="3.5" rx="1.5" fill="white" />
      <rect x="22" y="35" width="20" height="3.5" rx="1.5" fill="white" />
      <rect x="22" y="43" width="14" height="3.5" rx="1.5" fill="white" />
    </svg>
  )
}

export default DocumentTypeIcon