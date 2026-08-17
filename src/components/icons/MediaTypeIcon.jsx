// RCFMOUAULIBRARYreact/student-dashboard/src/components/icons/MediaTypeIcon.jsx
// Custom placeholder icons shown when a resource has no thumbnail yet.
// kind: 'audio' | 'video' | 'book' (anything else falls through to null,
// caller should keep using the material-symbols fallback for that case).
function MediaTypeIcon({ kind, className = 'w-10 h-10' }) {
  if (kind === 'audio') {
    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
        <circle cx="50" cy="50" r="14" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="4" fill="#000000" />
        <path d="M78 22 L62 40 L58 36" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'video') {
    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="22" width="70" height="56" rx="10" fill="#000000" stroke="#FFFFFF" strokeWidth="3" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 3" />
        <path d="M44 38 L62 50 L44 62 Z" fill="#FFFFFF" />
      </svg>
    )
  }

  if (kind === 'book') {
    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M50 78 C35 70 20 74 14 76 V28 C20 26 35 22 50 30 Z" fill="#000000" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 78 C65 70 80 74 86 76 V28 C80 26 65 22 50 30 Z" fill="#000000" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
        <line x1="50" y1="30" x2="50" y2="78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 14 L52 20 L58 21 L54 25 L55 31 L50 28 L45 31 L46 25 L42 21 L48 20 Z" fill="#FFFFFF" />
      </svg>
    )
  }

  return null
}

export default MediaTypeIcon