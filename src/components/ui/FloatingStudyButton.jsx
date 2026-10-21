import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const HIDDEN_PREFIXES = ['/reading-space', '/signin', '/splash', '/complete-profile', '/admin']

function FloatingStudyButton() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (!isAuthenticated) return null
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  if (/^\/resources\/[^/]+\/read/.test(pathname)) return null

  return (
    <button
      onClick={() => navigate('/reading-space')}
      aria-label="Open Reading Space"
      className="group fixed z-40 right-4 bottom-24 md:bottom-8 lg:right-[21rem] w-14 h-14 rounded-full flex items-center justify-center"
    >
      <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping motion-reduce:hidden" />
      <span
        className="absolute inset-0 rounded-full bg-primary/30 animate-ping motion-reduce:hidden"
        style={{ animationDelay: '0.8s' }}
      />
      <span className="relative w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/40 border border-white/20 active:scale-90 transition-transform group-hover:scale-110">
        <span className="material-symbols-outlined text-[28px]">auto_stories</span>
      </span>
      <span className="pointer-events-none absolute right-16 whitespace-nowrap px-3 py-1.5 rounded-full bg-surface-container-high border border-outline text-on-surface font-label-md text-label-md opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all hidden md:block">
        Study space
      </span>
    </button>
  )
}

export default FloatingStudyButton