// RCFMOUAULIBRARYreact/student-dashboard/src/components/auth/AuthShowcase.jsx
// Desktop sign-in left panel: a night-sky library scene in RCF's own colours
// (deep ink, warm orange and teal glows), the headline, what's included, and
// the owl peeking up from behind the books at the bottom, watching the cursor.
import { useState } from 'react'
import PeekingOwl from './PeekingOwl'

const INCLUDED = [
  ['menu_book', 'Books, past questions and lecture notes', 'For every MOUAU department and level.'],
  ['offline_pin', 'Read offline, with no data', 'Download once, read anywhere.'],
  ['auto_awesome', 'Notes written for your course', 'Ask for lecture notes we don\'t have and our AI writes them.'],
  ['chat', 'Bro Paul on WhatsApp', 'Ask for any material right from your chats.'],
]

const STARS = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 70}%`,
  size: i % 5 === 0 ? 3 : 2,
  delay: `${(i % 9) * 0.35}s`,
}))

function AuthShowcase({ title = 'Your library. Everywhere. Even offline.', subtitle = 'The RCF MOUAU digital library: study materials, devotionals and more, free for every member.' }) {
  const [open, setOpen] = useState(true)
  return (
    <aside className="relative hidden md:flex flex-col overflow-hidden bg-[#060b14] text-white">
      {/* sky glows */}
      <span className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-orange-500/20 blur-[110px]" aria-hidden="true" />
      <span className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full bg-teal-400/15 blur-[110px]" aria-hidden="true" />
      <span className="absolute bottom-0 left-1/4 w-[420px] h-[260px] rounded-full bg-indigo-500/15 blur-[90px]" aria-hidden="true" />
      {STARS.map((s, i) => (
        <span key={i} className="rcf-twinkle absolute rounded-full bg-white" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} aria-hidden="true" />
      ))}

      <div className="relative z-10 px-12 lg:px-16 pt-12 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <img src="/logoapp.jpg" alt="" className="w-10 h-10 rounded-xl object-cover bg-white" />
          <span className="font-label-md text-label-md tracking-[0.2em] uppercase text-white/70">RCF MOUAU Library</span>
        </div>

        <h1 className="mt-14 font-display text-[44px] lg:text-[54px] leading-[1.02] font-extrabold tracking-tight max-w-xl">
          {title}
        </h1>
        <p className="mt-4 text-[17px] text-white/70 max-w-lg">{subtitle}</p>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-8 self-start flex items-center gap-1 font-label-md text-label-md font-semibold text-white"
          aria-expanded={open}
        >
          See what's included
          <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${open ? '' : 'rotate-180'}`}>keyboard_arrow_up</span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <ul className="overflow-hidden flex flex-col gap-4 pt-4 max-w-lg">
            {INCLUDED.map(([icon, head, text]) => (
              <li key={head} className="flex gap-3">
                <span className="material-symbols-outlined text-orange-400 text-[22px] mt-0.5">{icon}</span>
                <span>
                  <span className="block font-body-md text-body-md font-semibold">{head}</span>
                  <span className="block font-label-md text-label-md text-white/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* the owl, peeking over the books, watching you */}
      <div className="relative z-10 mt-6 flex justify-center">
        <PeekingOwl className="w-[340px] lg:w-[400px] h-auto drop-shadow-[0_-10px_40px_rgba(249,115,22,0.18)]" />
      </div>
    </aside>
  )
}

export default AuthShowcase
