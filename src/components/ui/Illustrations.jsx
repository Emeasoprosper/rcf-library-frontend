// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/Illustrations.jsx
// Soft, rounded "storybook" illustrations drawn in SVG (no image files):
// verse card art, study-tip art, badge medals, a living flame and the owl.
import {
  Footprints, BookOpen, GraduationCap, Flame, Zap, Crown, CircleCheckBig, Flag,
  Bookmark, Download, HeartHandshake, Library, Megaphone, Award, Lock,
} from 'lucide-react'

export function VerseArt({ className = '' }) {
  return (
    <svg viewBox="0 0 220 170" className={className} aria-hidden="true">
      <circle cx="150" cy="58" r="44" fill="#FFE9B0" opacity="0.9" />
      <circle cx="150" cy="58" r="28" fill="#FFF4D6" />
      {/* clouds */}
      <g fill="#FFFFFF">
        <path d="M18 70c0-10 8-17 18-17 4-9 13-14 23-12 8 2 13 8 14 15 8 0 14 6 14 14H18z" opacity="0.95" />
        <path d="M150 112c0-8 7-14 15-14 3-7 11-11 19-9 6 1 10 6 11 12 7 0 12 5 12 11h-57z" opacity="0.9" />
      </g>
      {/* dove */}
      <g className="rcf-float" style={{ animationDuration: '5s' }}>
        <path d="M96 40c8-6 18-6 24 0-6 0-10 3-12 7 6-1 12 1 16 6-10-1-20 1-28-4-4 3-9 3-12 1 4-2 8-5 12-10z" fill="#FFFFFF" stroke="#C9CCF2" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="117" cy="40" r="1.3" fill="#3B3B6B" />
        <path d="M121 41l4 1-4 1" fill="#F6A04D" />
      </g>
      {/* open book */}
      <ellipse cx="110" cy="152" rx="70" ry="7" fill="#3B3B6B" opacity="0.12" />
      <path d="M40 92c22-8 48-8 70 6v52c-22-12-48-12-70-6z" fill="#5B54E8" />
      <path d="M180 92c-22-8-48-8-70 6v52c22-12 48-12 70-6z" fill="#4A43D6" />
      <path d="M46 92c20-6 44-5 64 8v46c-20-11-44-12-64-7z" fill="#FFFDF6" />
      <path d="M174 92c-20-6-44-5-64 8v46c20-11 44-12 64-7z" fill="#FFF8E8" />
      <g stroke="#D9D3C2" strokeWidth="2" strokeLinecap="round">
        <path d="M58 104c14-3 28-2 40 4M58 114c14-3 28-2 40 4M58 124c14-3 28-2 40 4" />
        <path d="M162 104c-14-3-28-2-40 4M162 114c-14-3-28-2-40 4M162 124c-14-3-28-2-40 4" />
      </g>
      <path d="M128 98v30l6-5 6 5V96" fill="#F25F5C" />
      {/* sparkles */}
      <g fill="#FFC94D">
        <path d="M30 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M196 22l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
      </g>
    </svg>
  )
}

export function TipArt({ className = '' }) {
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden="true">
      <circle cx="104" cy="64" r="52" fill="#D9F5EE" />
      <ellipse cx="100" cy="158" rx="72" ry="7" fill="#1F3B3A" opacity="0.12" />
      {/* bulb */}
      <g className="rcf-float" style={{ animationDuration: '4.5s' }}>
        <circle cx="104" cy="62" r="34" fill="#FFE27A" opacity="0.45" />
        <path d="M104 26c-20 0-34 15-34 33 0 12 6 20 13 27 4 4 6 8 6 13h30c0-5 2-9 6-13 7-7 13-15 13-27 0-18-14-33-34-33z" fill="#FFD84D" />
        <path d="M86 50c3-9 10-14 18-15" stroke="#FFF4C2" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M96 99V80l8 8 8-8v19" stroke="#E0A400" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <rect x="89" y="99" width="30" height="8" rx="3" fill="#8E9AAF" />
        <rect x="91" y="107" width="26" height="7" rx="3" fill="#6F7B91" />
        <rect x="96" y="114" width="16" height="5" rx="2.5" fill="#5A6578" />
      </g>
      {/* books */}
      <rect x="20" y="132" width="62" height="12" rx="3" fill="#5B7CFA" />
      <rect x="26" y="120" width="54" height="12" rx="3" fill="#F472B6" />
      <rect x="22" y="108" width="50" height="12" rx="3" fill="#34C3A3" />
      <g stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2"><path d="M30 138h40M34 126h38M30 114h34" /></g>
      {/* plant */}
      <path d="M152 150h28l-4-22h-20z" fill="#F59E6B" />
      <g fill="#4CAF50">
        <path d="M166 128c-2-14 2-26 12-32-2 12-4 22-12 32z" />
        <path d="M164 128c-10-8-14-18-10-30 6 8 10 18 10 30z" fill="#6CC04A" />
        <path d="M167 128c8-6 16-8 24-4-6 6-14 8-24 4z" fill="#3E9A44" />
      </g>
      <g fill="#FFC94D">
        <path d="M150 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M44 56l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
      </g>
    </svg>
  )
}

const MEDAL_ICONS = {
  first_steps: Footprints,
  bookworm: BookOpen,
  scholar: GraduationCap,
  streak_3: Flame,
  streak_7: Zap,
  streak_30: Crown,
  finisher: CircleCheckBig,
  goal_crusher: Flag,
  collector: Bookmark,
  offline_ready: Download,
  contributor: HeartHandshake,
  librarian: Library,
  voice: Megaphone,
}
const MEDAL_TONES = {
  blue: ['#6D8BFF', '#3F5BD9'],
  green: ['#7DD36A', '#3E9A44'],
  violet: ['#A98BFF', '#6A4BD6'],
  orange: ['#FFB25E', '#E86A1A'],
  pink: ['#F48FD3', '#C2389E'],
  amber: ['#FFD86B', '#D69A0B'],
  teal: ['#5FD8C7', '#0E8F86'],
  slate: ['#A7B4C8', '#56637A'],
}

// A ribboned medal. Locked badges show a soft grey medal with a padlock.
export function Medal({ badge, size = 56 }) {
  const [light, dark] = badge.earned ? MEDAL_TONES[badge.color] || MEDAL_TONES.blue : ['#D5D9E2', '#A7AEBD']
  const Icon = badge.earned ? MEDAL_ICONS[badge.key] || Award : Lock
  const id = `medal-${badge.key}-${badge.earned ? 'on' : 'off'}`
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 64 76" aria-hidden="true" className={badge.earned ? '' : 'opacity-70'}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d="M18 2h12l6 26-10 4z" fill={badge.earned ? '#F25F5C' : '#C4C9D4'} />
      <path d="M46 2H34l-6 26 10 4z" fill={badge.earned ? '#5B7CFA' : '#B4BAC7'} />
      <circle cx="32" cy="46" r="26" fill={dark} />
      <circle cx="32" cy="46" r="22.5" fill={`url(#${id})`} />
      <circle cx="32" cy="46" r="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M18 36a17 17 0 0 1 12-8" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
      <foreignObject x="20" y="34" width="24" height="24">
        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} strokeWidth={2.4} color="#FFFFFF" />
        </div>
      </foreignObject>
    </svg>
  )
}

// A flame made of layers that sway independently, with embers drifting up.
export function AnimatedFlame({ size = 46, lit = true }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" aria-hidden="true" className={lit ? '' : 'grayscale opacity-60'}>
      <ellipse cx="30" cy="68" rx="16" ry="3" fill="#000" opacity="0.15" />
      <g className="rcf-flame-a">
        <path d="M30 4c4 12 18 18 18 38 0 13-8 24-18 24S12 55 12 42c0-10 5-14 7-22 2 6 5 9 8 10-1-10 0-18 3-26z" fill="#FF5A1F" />
      </g>
      <g className="rcf-flame-b">
        <path d="M30 20c3 9 12 13 12 26 0 9-5 16-12 16s-12-7-12-16c0-6 3-9 5-14 1 4 3 6 5 7 0-7 0-13 2-19z" fill="#FF9A1F" />
      </g>
      <g className="rcf-flame-c">
        <path d="M30 34c2 6 7 9 7 17 0 6-3 10-7 10s-7-4-7-10c0-5 3-7 4-10 1 2 2 3 3 3 0-4-1-7 0-10z" fill="#FFD84D" />
        <ellipse cx="30" cy="55" rx="3.5" ry="5" fill="#FFF6D1" />
      </g>
      {lit && (
        <g fill="#FFC94D">
          <circle className="rcf-ember" cx="22" cy="30" r="1.6" style={{ '--ex': '-6px', animationDelay: '0s' }} />
          <circle className="rcf-ember" cx="38" cy="26" r="1.3" style={{ '--ex': '7px', animationDelay: '0.6s' }} />
          <circle className="rcf-ember" cx="30" cy="20" r="1.1" style={{ '--ex': '2px', animationDelay: '1.2s' }} />
        </g>
      )}
    </svg>
  )
}

// The library owl, wings flapping (see .rcf-wing-* in index.css).
export function OwlArt({ className = '' }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      <g className="rcf-wing-l">
        <path d="M44 48C26 36 8 40 2 50c12 2 22 8 30 16 6-4 10-10 12-18z" fill="#8A5A3B" />
        <path d="M30 52c-8-2-16 0-22 3M34 58c-8-1-14 1-18 4" stroke="#6B4129" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      <g className="rcf-wing-r">
        <path d="M76 48c18-12 36-8 42 2-12 2-22 8-30 16-6-4-10-10-12-18z" fill="#8A5A3B" />
        <path d="M90 52c8-2 16 0 22 3M86 58c8-1 14 1 18 4" stroke="#6B4129" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      <path d="M40 30l4-14 10 10M80 30l-4-14-10 10" fill="#A06C47" />
      <ellipse cx="60" cy="56" rx="24" ry="30" fill="#A06C47" />
      <ellipse cx="60" cy="66" rx="15" ry="18" fill="#F3DDBE" />
      <g stroke="#D9BC95" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M54 62l3 3 3-3 3 3 3-3M52 70l3 3 3-3 3 3 3-3 3 3" />
      </g>
      <circle cx="50" cy="42" r="10" fill="#FFFFFF" />
      <circle cx="70" cy="42" r="10" fill="#FFFFFF" />
      <circle cx="51" cy="43" r="5" fill="#2B2B3B" />
      <circle cx="69" cy="43" r="5" fill="#2B2B3B" />
      <circle cx="52.5" cy="41.5" r="1.6" fill="#FFFFFF" />
      <circle cx="70.5" cy="41.5" r="1.6" fill="#FFFFFF" />
      <path d="M56 50l4 6 4-6z" fill="#F6A04D" />
      <path d="M52 84l-3 6M56 85l0 6M64 85l0 6M68 84l3 6" stroke="#F6A04D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
