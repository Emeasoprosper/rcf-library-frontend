import { Link, useLocation } from 'react-router-dom'
import NavIcon from './NavIcon'
import { navItems, TOUR_NAV_IDS } from '../../lib/navItems'

function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 px-4 pt-2 bg-surface/80 backdrop-blur-md [mask-image:linear-gradient(to_top,black_78%,rgba(0,0,0,0.95)_85%,rgba(0,0,0,0.55)_92%,transparent_100%)] md:hidden"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <style>{`
        @keyframes bnHomeBounce { 0% { transform: translateY(0); } 40% { transform: translateY(-4px); } 70% { transform: translateY(1px); } 100% { transform: translateY(0); } }
        .bn-anim-home-dot { animation: bnHomeBounce 0.5s cubic-bezier(0.175,0.885,0.32,1.275); transform-origin: 26px 19px; }

        @keyframes bnSearchPulse { 0% { transform: scale(0.75); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .bn-anim-search-lens { animation: bnSearchPulse 0.4s ease-out; transform-origin: 22px 22px; }
        @keyframes bnSearchHandle { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        .bn-anim-search-handle { animation: bnSearchHandle 0.3s ease-out 0.15s both; transform-origin: 31px 31px; }

        @keyframes bnPageFanLeft { 0% { transform: translateX(0); } 50% { transform: translateX(-2px); } 100% { transform: translateX(0); } }
        .bn-anim-page-1 { animation: bnPageFanLeft 0.5s cubic-bezier(0.25,1,0.5,1); }
        @keyframes bnPageFanRight { 0% { transform: translateX(0); } 50% { transform: translateX(3px); } 100% { transform: translateX(0); } }
        .bn-anim-page-2 { animation: bnPageFanRight 0.5s cubic-bezier(0.25,1,0.5,1); }

        @keyframes bnSpinDots { 0% { transform: rotate(0deg); } 100% { transform: rotate(180deg); } }
        .bn-anim-contribute-dots { animation: bnSpinDots 0.6s cubic-bezier(0.4,0,0.2,1); transform-origin: 26px 26px; }

        @keyframes bnHeadPop { 0% { transform: scale(0.7); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .bn-anim-profile-head { animation: bnHeadPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275); transform-origin: 26px 21px; }
        @keyframes bnArcRotate { 0% { transform: rotate(0deg); } 50% { transform: rotate(-20deg); } 100% { transform: rotate(0deg); } }
        .bn-anim-profile-arc { animation: bnArcRotate 0.6s ease-in-out; transform-origin: 26px 26px; }
      `}</style>

      <div className="flex justify-around items-center [mask-image:none]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              data-tour={TOUR_NAV_IDS[item.icon]}
              className={`flex flex-col items-center justify-center gap-1 transition-colors duration-150 active:scale-90 ${
                isActive ? 'text-orange-500 font-semibold' : 'text-on-surface-variant'
              }`}
            >
              <NavIcon icon={item.icon} active={isActive} />
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav