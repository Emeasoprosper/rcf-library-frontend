import { useNavigate } from 'react-router-dom'
import SplashLight from '../assets/SplahLightMode.svg'
import SplashDark from '../assets/SplashDarkMode.svg'

function Splash() {
  const navigate = useNavigate()

  return (
    <main className="flex flex-col min-h-screen w-full px-margin-mobile py-16 bg-surface-container-lowest text-on-surface">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-stack-md max-w-sm w-full mx-auto">
        <img src={SplashLight} alt="RCF MOUAU Library" className="w-64 h-64 dark:hidden" />
        <img src={SplashDark} alt="RCF MOUAU Library" className="w-64 h-64 hidden dark:block" />

        <div className="flex flex-col gap-stack-sm">
          <h1 className="font-display text-display tracking-tight text-primary">
            Digital Library
          </h1>
          <p className="font-body-lg text-on-surface-variant tracking-wide uppercase text-[12px] font-semibold">
            Learn. Grow. Serve.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-gutter mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="w-full py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate('/signin')}
          className="w-full py-4 border border-outline text-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:bg-surface-container-low transition-all"
        >
          Sign In
        </button>
        <p className="font-label-sm text-on-secondary-container text-center mt-stack-md">
          Redeemed Christian Fellowship, MOUAU Chapter
        </p>
      </div>
    </main>
  )
}

export default Splash
