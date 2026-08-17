# What's in this zip, and what isn't

Everything under `src/` here is code I (Claude) authored across our conversation,
reconstructed in full from what I gave you in chat. `index.html`, `package.json`,
`vite.config.js`, and `eslint.config.js` are your actual real files, copied through
as-is.

## NOT included — you built these yourself, I never saw their contents:

- `src/contexts/AuthContext.jsx`
- `src/routes/ProtectedRoute.jsx`
- `src/pages/RequestMaterial.jsx`
- `src/services/api.js`
- `src/lib/submissions.js`
- Your actual asset files: `SplahLightMode.svg`, `SplashDarkMode.svg`, favicons, etc.
  (referenced by `Splash.jsx` / `SignIn.jsx` but not included here)

## Before this runs

1. Copy your real versions of the files above into the matching folders.
2. In `src/routes/AppRoutes.jsx`, uncomment the `RequestMaterial` and
   `ProtectedRoute` imports, and re-wrap the routes that need auth protection
   in `<ProtectedRoute>` — I removed that wrapping here since I don't have
   your real `ProtectedRoute.jsx` to import safely.
3. `src/pages/Profile.jsx` imports `useAuth` from `../contexts/AuthContext` —
   confirm that hook name matches what your real `AuthContext.jsx` exports.
4. Copy your real `src/assets/` folder in (logos, favicons).
5. `npm install` fresh once merged — I didn't include `node_modules`.

## Known incomplete pieces (already flagged in chat, not new)

- Google Sign-In button in `SignIn.jsx` is a stub (`navigate('/home')`), not
  wired to real auth yet.
- Every page's data is hardcoded local arrays — none of it is fetched from
  your backend yet.
- Admin routes have no role-check — currently reachable by anyone once
  `ProtectedRoute` is re-added, since that only checks "logged in," not "is admin."
- "Send via email" in Admin Announcements visibly queues but doesn't deliver —
  needs a backend function.
