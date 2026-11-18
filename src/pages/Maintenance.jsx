// Shown instead of the whole app while MAINTENANCE_MODE is on (src/maintenance.js).
// Self-contained styles so it looks right even with nothing else loaded.
import { useLayoutEffect, useRef, useState } from 'react'

// Space kept around the card on every side: 16px on phones, a bit more on
// bigger screens so it never touches the edges.
const gapFor = (vw, vh) => Math.max(16, Math.min(vw, vh) * 0.05)

// The card is designed at one size and scaled to fit the screen, so it is
// never cut off on short phones nor tiny on big screens: equal space all
// round, scrolling never needed.
function useFitScale(ref) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const vw = window.visualViewport?.width || window.innerWidth
      const vh = window.visualViewport?.height || window.innerHeight
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      // Shrink to fit; grow a little on big screens, but not past 1.25x.
      const gap = gapFor(vw, vh)
      setScale(Math.min((vw - gap * 2) / w, (vh - gap * 2) / h, 1.25))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [ref])
  return scale
}

const STEPS = [
  { icon: 'auto_stories', label: 'Library & books', done: true },
  { icon: 'smart_toy', label: 'Bro Paul & AI notes', done: false },
  { icon: 'rocket_launch', label: 'Faster servers', done: false },
]

export default function Maintenance() {
  const cardRef = useRef(null)
  const scale = useFitScale(cardRef)
  return (
    <div className="mt-wrap">
      <style>{CSS}</style>
      <div className="mt-glow mt-glow-a" />
      <div className="mt-glow mt-glow-b" />
      <div className="mt-grid" />

      <main ref={cardRef} className="mt-card" role="main" style={{ '--mt-scale': scale }}>
        <div className="mt-logo-ring">
          <img src="/logoapp.jpg" alt="RCF MOUAU Library" className="mt-logo" />
        </div>

        <span className="mt-pill">
          <span className="mt-dot" /> Upgrade in progress
        </span>

        <h1 className="mt-title">
          Something better is
          <br />
          <span className="mt-accent">on the way</span>
        </h1>

        <p className="mt-text">
          The RCF MOUAU Library is taking a short break while we build a faster, smoother home for your books,
          past questions and lecture notes. We'll be back very soon.
        </p>

        <div className="mt-progress" aria-hidden="true">
          <div className="mt-progress-bar" />
        </div>

        <ul className="mt-steps">
          {STEPS.map((s) => (
            <li key={s.label} className={s.done ? 'mt-step mt-step-done' : 'mt-step'}>
              <span className="material-symbols-outlined mt-step-icon">{s.icon}</span>
              <span>{s.label}</span>
              <span className="mt-step-state">{s.done ? 'Ready' : 'Working on it'}</span>
            </li>
          ))}
        </ul>

        <div className="mt-safe">
          <span className="material-symbols-outlined">verified</span>
          <span>Your account, saved books and downloads are safe. Nothing is lost.</span>
        </div>

        <p className="mt-sign">
          Thank you for your patience, family 🙏
          <br />
          <span>— The RCF MOUAU Library Team</span>
        </p>
      </main>
    </div>
  )
}

const CSS = `
.mt-wrap {
  position: fixed; inset: 0; overflow: hidden;
  background: #070707; color: #f4f4f4;
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  display: flex; align-items: center; justify-content: center;
}
.mt-glow { position: fixed; border-radius: 50%; filter: blur(90px); opacity: .55; pointer-events: none; }
.mt-glow-a { width: 420px; height: 420px; background: #ff7a1a; top: -140px; right: -120px; animation: mt-float 14s ease-in-out infinite; }
.mt-glow-b { width: 360px; height: 360px; background: #b8471a; bottom: -160px; left: -120px; opacity: .35; animation: mt-float 18s ease-in-out infinite reverse; }
.mt-grid {
  position: fixed; inset: 0; pointer-events: none; opacity: .07;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
}
.mt-card {
  position: relative; flex: none; box-sizing: border-box; width: 440px; text-align: center;
  scale: var(--mt-scale, 1); transform-origin: center;
  background: rgba(22, 22, 22, .72); border: 1px solid rgba(255,255,255,.08);
  border-radius: 28px; padding: 36px 24px 28px;
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 30px 80px rgba(0,0,0,.55);
  animation: mt-rise .8s cubic-bezier(.2,.8,.2,1) both;
}
.mt-logo-ring {
  width: 88px; height: 88px; margin: 0 auto 18px; border-radius: 50%; padding: 3px;
  background: conic-gradient(from 0deg, #ff7a1a, #ffd2a8, #ff7a1a00 60%, #ff7a1a);
  animation: mt-spin 6s linear infinite;
}
.mt-logo { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; border: 3px solid #161616; animation: mt-spin 6s linear infinite reverse; }
.mt-pill {
  display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600;
  letter-spacing: .04em; text-transform: uppercase; color: #ffb27a;
  background: rgba(255,122,26,.12); border: 1px solid rgba(255,122,26,.3);
  padding: 6px 12px; border-radius: 999px;
}
.mt-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff7a1a; box-shadow: 0 0 0 0 rgba(255,122,26,.7); animation: mt-pulse 1.8s infinite; }
.mt-title { font-family: 'Playfair Display', Georgia, serif; font-size: 38px; line-height: 1.12; margin: 18px 0 12px; font-weight: 700; }
.mt-accent { background: linear-gradient(90deg, #ffffff, #ff9a4d 60%, #ff7a1a); -webkit-background-clip: text; background-clip: text; color: transparent; }
.mt-text { color: #b9b9b9; font-size: 15px; line-height: 1.6; margin: 0 auto 22px; max-width: 400px; }
.mt-progress { height: 8px; border-radius: 999px; background: #262626; overflow: hidden; margin-bottom: 20px; }
.mt-progress-bar {
  height: 100%; width: 72%; border-radius: inherit;
  background: linear-gradient(90deg, #ffffff 0%, #ffcfa6 35%, #ff7a1a 100%);
  position: relative; overflow: hidden; animation: mt-fill 2.2s cubic-bezier(.2,.8,.2,1) both;
}
.mt-progress-bar::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
  transform: translateX(-100%); animation: mt-shine 2.4s 2.2s ease-in-out infinite;
}
.mt-steps { list-style: none; padding: 0; margin: 0 0 18px; display: grid; gap: 8px; text-align: left; }
.mt-step {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px;
  background: #121212; border: 1px solid rgba(255,255,255,.06); font-size: 14px; font-weight: 500;
}
.mt-step-icon { font-size: 20px; color: #ff9a4d; }
.mt-step-state { margin-left: auto; font-size: 12px; color: #8a8a8a; display: inline-flex; align-items: center; gap: 6px; }
.mt-step-state::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #ff7a1a; animation: mt-pulse 1.8s infinite; }
.mt-step-done .mt-step-state { color: #7fd99a; }
.mt-step-done .mt-step-state::before { background: #3ecf6e; animation: none; }
.mt-safe {
  display: flex; align-items: center; gap: 10px; text-align: left; font-size: 13px; color: #cfcfcf;
  background: rgba(62, 207, 110, .08); border: 1px solid rgba(62, 207, 110, .22);
  border-radius: 14px; padding: 12px 14px; margin-bottom: 22px;
}
.mt-safe .material-symbols-outlined { color: #3ecf6e; font-size: 20px; }
.mt-sign { font-size: 14px; color: #d8d8d8; margin: 0; line-height: 1.6; }
.mt-sign span { color: #7c7c7c; font-size: 13px; }
@keyframes mt-rise { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes mt-spin { to { transform: rotate(360deg); } }
@keyframes mt-float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px, 40px); } }
@keyframes mt-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,122,26,.6); } 70% { box-shadow: 0 0 0 8px rgba(255,122,26,0); } 100% { box-shadow: 0 0 0 0 rgba(255,122,26,0); } }
@keyframes mt-fill { from { width: 0; } }
@keyframes mt-shine { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) {
  .mt-wrap *, .mt-wrap *::before, .mt-wrap *::after { animation: none !important; }
}
`
