// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/Celebrate.jsx
// Shared pieces for celebration popups and the questionnaire:
// falling confetti/ribbons, the "Book Buddy" mascot, and a birthday cake.
// All drawn in SVG/CSS, so there are no image files to load.

const CONFETTI_COLORS = ['#f97316', '#ec4899', '#a855f7', '#22c55e', '#eab308', '#3b82f6', '#14b8a6']
const SHAPES = ['rect', 'circle', 'ribbon', 'star', 'rect', 'ribbon']

// Deterministic spread (no Math.random in render) so pieces land scattered
// across the whole screen instead of clumping.
function pieces(count) {
  return Array.from({ length: count }, (_, i) => ({
    left: `${(i * 41 + 7) % 100}%`,
    delay: `${((i * 37) % 40) / 10}s`,
    dur: `${5 + ((i * 23) % 35) / 10}s`,
    drift: `${((i * 53) % 120) - 60}px`,
    spin: `${360 + ((i * 97) % 540)}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    size: 8 + ((i * 13) % 8),
  }))
}

function Piece({ shape, color, size }) {
  if (shape === 'circle') return <span className="block rounded-full" style={{ width: size * 0.8, height: size * 0.8, background: color }} />
  if (shape === 'rect') return <span className="block rounded-[2px]" style={{ width: size * 0.6, height: size * 1.2, background: color }} />
  if (shape === 'star') {
    return (
      <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill={color} />
      </svg>
    )
  }
  // Curly ribbon
  return (
    <svg width={size * 1.1} height={size * 2.6} viewBox="0 0 12 30" aria-hidden="true">
      <path d="M6 1c5 3-5 6 0 9s-5 6 0 9 -5 6 0 9" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// count stays low on purpose: a few pieces drifting down, then it stops.
export function Confetti({ count = 26 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces(count).map((p, i) => (
        <span
          key={i}
          className="rcf-confetti"
          style={{ left: p.left, '--delay': p.delay, '--dur': p.dur, '--drift': p.drift, '--spin': p.spin }}
        >
          <Piece shape={p.shape} color={p.color} size={p.size} />
        </span>
      ))}
    </div>
  )
}

// Book Buddy: a smiling book with blinking eyes. `prop` adds an accessory
// so each screen gets its own picture.
export function BookBuddy({ color = '#5b7cfa', prop = null, className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <ellipse cx="100" cy="186" rx="52" ry="8" fill="rgba(0,0,0,0.18)" />
      <g className="rcf-float">
        {/* book body */}
        <rect x="48" y="52" width="104" height="122" rx="16" fill={color} />
        <rect x="48" y="52" width="18" height="122" rx="8" fill="rgba(0,0,0,0.18)" />
        <rect x="140" y="62" width="10" height="104" rx="4" fill="#fff8e7" />
        {/* face */}
        <g className="rcf-blink">
          <ellipse cx="88" cy="104" rx="9" ry="11" fill="#fff" />
          <ellipse cx="120" cy="104" rx="9" ry="11" fill="#fff" />
          <circle cx="90" cy="106" r="4.5" fill="#1f1f2e" />
          <circle cx="122" cy="106" r="4.5" fill="#1f1f2e" />
        </g>
        <path d="M90 128 Q104 140 118 128" stroke="#1f1f2e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="78" cy="124" r="5" fill="rgba(255,120,150,0.55)" />
        <circle cx="130" cy="124" r="5" fill="rgba(255,120,150,0.55)" />
        {/* arms */}
        <path d="M48 120 Q30 112 28 96" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M152 120 Q170 112 172 96" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />

        {prop === 'cap' && (
          <g>
            <path d="M60 44 L100 26 L140 44 L100 62 Z" fill="#1f1f2e" />
            <rect x="84" y="46" width="32" height="14" rx="3" fill="#1f1f2e" />
            <path d="M138 45 L138 66" stroke="#facc15" strokeWidth="3" />
            <circle cx="138" cy="68" r="4" fill="#facc15" />
          </g>
        )}
        {prop === 'party' && (
          <g>
            <path d="M84 52 L100 14 L116 52 Z" fill="#ec4899" />
            <path d="M90 38 L110 38 M94 28 L106 28" stroke="#facc15" strokeWidth="3" />
            <circle cx="100" cy="13" r="6" fill="#facc15" />
          </g>
        )}
        {prop === 'heart' && (
          <path d="M172 78 c-6-10-22-6-20 6 c1 8 12 14 20 20 c8-6 19-12 20-20 c2-12-14-16-20-6z" fill="#f43f5e" />
        )}
        {prop === 'question' && (
          <g>
            <circle cx="166" cy="70" r="18" fill="#facc15" />
            <text x="166" y="78" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1f1f2e">?</text>
          </g>
        )}
        {prop === 'megaphone' && (
          <g transform="rotate(-20 170 80)">
            <path d="M156 72 L188 58 L188 102 L156 88 Z" fill="#f97316" />
            <rect x="148" y="72" width="10" height="16" rx="2" fill="#fb923c" />
          </g>
        )}
        {prop === 'sparkle' && (
          <g fill="#facc15">
            <path d="M170 50 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" />
            <path d="M34 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          </g>
        )}
        {prop === 'sun' && (
          <g>
            <circle cx="166" cy="56" r="16" fill="#facc15" />
            <g stroke="#facc15" strokeWidth="4" strokeLinecap="round">
              <path d="M166 30v-8M166 90v-8M140 56h-8M200 56h-8M148 38l-6-6M190 80l-6-6M184 38l6-6M142 80l6-6" />
            </g>
          </g>
        )}
      </g>
    </svg>
  )
}

export function CakeArt({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <ellipse cx="100" cy="182" rx="70" ry="9" fill="rgba(0,0,0,0.2)" />
      <g className="rcf-float">
        <rect x="34" y="110" width="132" height="66" rx="14" fill="#f9a8d4" />
        <path d="M34 128 q16 14 33 0 t33 0 t33 0 t33 0 V122 a14 14 0 0 0 -14 -12 H48 a14 14 0 0 0 -14 12z" fill="#fff" />
        <rect x="50" y="70" width="100" height="46" rx="12" fill="#c084fc" />
        <path d="M50 86 q12 10 25 0 t25 0 t25 0 t25 0 V82 a12 12 0 0 0 -12 -12 H62 a12 12 0 0 0 -12 12z" fill="#fff" />
        {[72, 100, 128].map((x) => (
          <g key={x}>
            <rect x={x - 4} y="44" width="8" height="28" rx="3" fill={x === 100 ? '#60a5fa' : '#facc15'} />
            <path className="rcf-flicker" d={`M${x} 26 q8 10 0 16 q-8 -6 0 -16z`} fill="#fb923c" />
          </g>
        ))}
        {[56, 84, 116, 144].map((x, i) => (
          <circle key={x} cx={x} cy={150 + (i % 2) * 8} r="4" fill={['#22c55e', '#3b82f6', '#f97316', '#facc15'][i]} />
        ))}
      </g>
    </svg>
  )
}
