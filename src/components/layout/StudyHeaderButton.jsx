import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TIPS = [
  { icon: 'auto_stories', label: 'Study space' },
  { icon: 'quiz', label: 'Practice questions' },
  { icon: 'edit_note', label: 'Take notes' },
  { icon: 'event_note', label: 'Plan your reading' },
  { icon: 'bookmarks', label: 'Saved material' },
]

function StudyHeaderButton({ className = '' }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % TIPS.length), 3000)
    return () => clearInterval(id)
  }, [])

  const tip = TIPS[i]

  return (
    <div className={className}>
      <style>{`
        @keyframes shbWave { 0% { transform: scale(1); opacity: 0.5; } 5% { transform: scale(1.35); opacity: 0; } 5.01% { transform: scale(1); opacity: 0.5; } 10% { transform: scale(1.35); opacity: 0; } 10.01%, 100% { transform: scale(1); opacity: 0; } }
        @keyframes shbSwap { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .shb-wave { animation: shbWave 33s ease-out infinite; opacity: 0; }
        .shb-swap { animation: shbSwap 380ms cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>
      <button
        onClick={() => navigate('/reading-space')}
        aria-label="Open Reading Space"
        className="relative flex items-center gap-2 h-10 pl-3 pr-4 rounded-full bg-orange-500 text-white font-label-md text-label-md shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
      >
        <span className="shb-wave pointer-events-none absolute inset-0 rounded-full bg-orange-500 motion-reduce:hidden" />
        <span key={`icon-${i}`} className="shb-swap relative material-symbols-outlined text-[22px]">
          {tip.icon}
        </span>
        <span className="relative h-5 w-36 overflow-hidden text-left">
          <span key={`label-${i}`} className="shb-swap block leading-5 whitespace-nowrap">
            {tip.label}
          </span>
        </span>
      </button>
    </div>
  )
}

export default StudyHeaderButton