// RCFMOUAULIBRARYreact/student-dashboard/src/pages/SignIn.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import SplashLight from '../assets/SplahLightMode.svg'
import SplashDark from '../assets/SplashDarkMode.svg'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_LOGIN_URI = `${import.meta.env.VITE_API_BASE_URL}/auth/google/redirect-callback`
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_MESSAGES = {
  missing_credential: 'Google sign-in was cancelled or failed. Please try again.',
  suspended: 'This account has been suspended.',
  signin_failed: 'Sign-in failed. Please try again.',
}

function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { loginWithEmail, signupWithEmail } = useAuth()
  // Where ProtectedRoute sent the user here FROM (e.g. /s/abc123 from a
  // share link) — falls back to /home for a normal, direct sign-in visit.
  const returnTo = location.state?.from || '/home'
  const buttonRef = useRef(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  const [accountExists, setAccountExists] = useState(null)
  const [emailChecking, setEmailChecking] = useState(false)
  const [googleOnly, setGoogleOnly] = useState(false)
  const debounceRef = useRef(null)
  // True only when a signup attempt was actually rejected by the backend
  // because the account already exists (409) — a real fallback for when
  // the live checkEmail debounce hasn't resolved yet (fast typing, slow
  // network) and the form was still showing "Create account". Distinct
  // from the normal `error` string so it can render its own "Sign in
  // instead" button rather than a dead-end error line.
  const [accountExistsConflict, setAccountExistsConflict] = useState(false)

  // Surface any error Google's redirect flow bounced back with
  // (?error=... appended by the backend's redirect-callback route).
  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam) {
      setError(ERROR_MESSAGES[errParam] || 'Sign-in failed. Please try again.')
    }
  }, [searchParams])

  // Full-page redirect flow — no popup is ever opened, so there's no
  // "Failed to open popup window" failure mode to hit. Google navigates
  // the whole page to accounts.google.com, then POSTs the credential
  // straight to the backend's redirect-callback route (a real HTML form
  // submission, not a JS fetch), which sets session cookies and
  // redirects back here already signed in.
  useEffect(() => {
    let cancelled = false

    function tryRender() {
      if (cancelled) return
      if (window.google?.accounts?.id && buttonRef.current) {
        // login_uri must match EXACTLY an Authorized redirect URI
        // registered in Google Cloud Console — appending ?returnTo=
        // here broke that exact match and caused a live "Error 400:
        // redirect_uri_mismatch", blocking ALL Google sign-in. returnTo
        // is now stashed in sessionStorage instead, which survives the
        // full-page trip to accounts.google.com and back since it's the
        // same browser tab — read back out by RootRedirect in
        // AppRoutes.jsx once the user lands back here signed in.
        if (returnTo && returnTo !== '/home') {
          sessionStorage.setItem('rcf_post_login_return_to', returnTo)
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'redirect',
          login_uri: GOOGLE_REDIRECT_LOGIN_URI,
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          width: 320,
          text: 'continue_with',
        })
        setChecking(false)
      } else {
        setTimeout(tryRender, 100)
      }
    }
    tryRender()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!showEmailForm || !EMAIL_RE.test(email)) {
      setAccountExists(null)
      setGoogleOnly(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setEmailChecking(true)
        const result = await authApi.checkEmail(email)
        setAccountExists(result.exists && result.hasPassword)
        setGoogleOnly(Boolean(result.googleOnly))
      } catch {
        setAccountExists(null)
      } finally {
        setEmailChecking(false)
      }
    }, 500)

    return () => clearTimeout(debounceRef.current)
  }, [email, showEmailForm])

  async function handleEmailSubmit(e) {
    e.preventDefault()

    if (emailChecking) {
      setError('Still checking that email — please wait a moment.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (accountExists !== true && !name.trim()) {
      setError('Please enter your name.')
      return
    }

    try {
      setError('')
      setAccountExistsConflict(false)
      setEmailLoading(true)
      if (accountExists === true) {
        await loginWithEmail(email, password)
      } else {
        await signupWithEmail(email, password, name)
      }
      navigate(returnTo, { replace: true })
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      // Backend sends this exact message on a 409 duplicate-signup — see
      // auth.js's /signup route. String match rather than a status code
      // because apiFetch (services/api.js) only throws Error(message),
      // it doesn't preserve the HTTP status on the thrown error.
      if (msg.toLowerCase().includes('already exists')) {
        setAccountExistsConflict(true)
      } else {
        setError(msg)
      }
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <main
      className="flex flex-col min-h-screen w-full px-margin-mobile py-16 text-on-surface"
      style={{ background: 'radial-gradient(circle at 50% 20%, #1a1a1a 0%, #000000 70%)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-stack-md max-w-sm w-full mx-auto">
        <img src={SplashLight} alt="RCF MOUAU Library" className="w-32 h-32 dark:hidden" />
        <img src={SplashDark} alt="RCF MOUAU Library" className="w-32 h-32 hidden dark:block" />

        <div className="flex flex-col gap-stack-sm">
          <h1 className="font-headline-lg text-headline-lg font-display text-white">
            Sign in to continue
          </h1>
          <p className="font-body-md text-white/60">
            Use your Google account to access the library.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-gutter mx-auto items-center">
        <div className="relative w-full h-12">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full rounded-md bg-white text-black font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-lg pointer-events-none"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div ref={buttonRef} className="absolute inset-0 w-full h-full opacity-0 overflow-hidden" />
        </div>

        {checking && (
          <p className="font-label-sm text-label-sm text-white/50">Loading sign-in…</p>
        )}

        <div className="flex items-center gap-3 w-full my-1">
          <div className="h-px flex-1 bg-white/15" />
          <span className="font-label-sm text-label-sm text-white/40">or</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full h-12 rounded-md border border-white/20 text-white font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
            Sign in with email
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setAccountExistsConflict(false)
              }}
              placeholder="Email address"
              autoComplete="email"
              autoFocus
              className="w-full h-12 rounded-md bg-white/5 border border-white/20 px-4 text-white font-body-md placeholder:text-white/40 focus:outline-none focus:border-white/50"
            />

            {accountExistsConflict && (
              <div className="w-full rounded-md bg-white/5 border border-white/20 px-4 py-3 flex flex-col gap-2">
                <p className="font-label-sm text-label-sm text-white/70">
                  An account with this email already exists.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAccountExistsConflict(false)
                    setAccountExists(true)
                    setName('')
                    setError('')
                  }}
                  className="self-start font-label-sm text-label-sm text-white font-semibold underline underline-offset-2"
                >
                  Sign in instead
                </button>
              </div>
            )}

            {googleOnly && (
              <p className="font-label-sm text-label-sm text-white/50">
                This email is linked to a Google account. Use "Continue with Google" above.
              </p>
            )}

            {accountExists !== true && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                className="w-full h-12 rounded-md bg-white/5 border border-white/20 px-4 text-white font-body-md placeholder:text-white/40 focus:outline-none focus:border-white/50"
              />
            )}

            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={accountExists === true ? 'current-password' : 'new-password'}
                className="w-full h-12 rounded-md bg-white/5 border border-white/20 pl-4 pr-12 text-white font-body-md placeholder:text-white/40 focus:outline-none focus:border-white/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a19.5 19.5 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c6.5 0 10 7 10 7a19.5 19.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {emailChecking && (
              <p className="font-label-sm text-label-sm text-white/40">Checking email…</p>
            )}

            <button
              type="submit"
              disabled={emailLoading || emailChecking || googleOnly}
              className="w-full h-12 rounded-md bg-white text-black font-label-md text-label-md font-semibold flex items-center justify-center disabled:opacity-60"
            >
              {emailLoading
                ? 'Please wait…'
                : emailChecking
                ? 'Checking email…'
                : accountExists === true
                ? 'Sign in'
                : 'Create account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false)
                setError('')
                setEmail('')
                setPassword('')
                setName('')
                setAccountExists(null)
                setGoogleOnly(false)
                setAccountExistsConflict(false)
              }}
              className="font-label-sm text-label-sm text-white/50 hover:text-white/80"
            >
              Back
            </button>
          </form>
        )}

        {error && (
          <p className="font-label-sm text-label-sm text-error text-center">{error}</p>
        )}

        <p className="font-label-sm text-label-sm text-white/40 text-center mt-stack-sm">
          By continuing, you agree to the library's terms of use.
        </p>
      </div>
    </main>
  )
}

export default SignIn