// RCFMOUAULIBRARYreact/student-dashboard/src/components/auth/AuthShowcase.jsx
// Desktop sign-in left panel: a night-sky library scene in RCF's own colours
// (deep ink, warm orange and teal glows), the headline, and the big owl
// peeking up from behind the books (one wears the RCF logo), watching the
// cursor. `owlCovering` makes it cover its eyes while a password is typed.
import PeekingOwl from './PeekingOwl'

const STARS = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 70}%`,
  size: i % 5 === 0 ? 3 : 2,
  delay: `${(i % 9) * 0.35}s`,
}))

function AuthShowcase({
  title = 'Your library. Everywhere. Even offline.',
  subtitle = 'The RCF MOUAU digital library: study materials, devotionals and more, free for every member.',
  owlCovering = false,
}) {
  return (
    <aside className="relative hidden md:flex flex-col h-full min-h-0 overflow-hidden bg-[#060b14] text-white">
      {/* sky glows */}
      <span className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-orange-500/20 blur-[110px]" aria-hidden="true" />
      <span className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full bg-teal-400/15 blur-[110px]" aria-hidden="true" />
      <span className="absolute bottom-0 left-1/4 w-[420px] h-[260px] rounded-full bg-indigo-500/15 blur-[90px]" aria-hidden="true" />
      {STARS.map((s, i) => (
        <span key={i} className="rcf-twinkle absolute rounded-full bg-white" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} aria-hidden="true" />
      ))}

      {/* Sizes follow the screen height (vh) so everything fits one screen. */}
      <div className="relative z-10 px-12 lg:px-16 pt-[7vh] flex-none">
        <h1 className="font-display text-[clamp(28px,5.6vh,56px)] leading-[1.02] font-extrabold tracking-tight max-w-xl">
          {title}
        </h1>
        <p className="mt-[1.8vh] text-[clamp(14px,2.1vh,18px)] text-white/70 max-w-lg">{subtitle}</p>
      </div>

      {/* the owl, peeking over the books, watching you */}
      <div className="relative z-10 flex-1 min-h-0 flex items-end justify-center pt-[3vh]">
        <PeekingOwl
          covering={owlCovering}
          className="w-full max-w-[680px] h-full max-h-[58vh] drop-shadow-[0_-10px_40px_rgba(249,115,22,0.18)]"
        />
      </div>
    </aside>
  )
}

export default AuthShowcase
