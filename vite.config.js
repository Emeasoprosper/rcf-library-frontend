import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      // Without this, the manifest + service worker are ONLY generated
      // during `vite build`. Under plain `vite dev` (what's running when
      // testing through a trycloudflare.com tunnel), there is no manifest
      // link and no SW registration at all — so the browser has zero
      // installability signals and beforeinstallprompt can never fire,
      // no matter how correct the manifest config below is.
      devOptions: {
        enabled: true,
        type: 'module',
      },

      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png'
      ],

      manifest: {
        id: '/',
        name: 'RCF MOUAU Digital Library',
        short_name: 'RCF Library',
        description:
          'Books, past questions, devotionals, and study resources for RCF MOUAU students.',
        theme_color: '#000000',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            // Separate file, not the plain logo — Android crops maskable
            // icons into a circle/squircle, so this one has the logo
            // shrunk and centered on a solid background so nothing near
            // the edges gets clipped.
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        // Was missing jpg/jpeg/webp/woff2 — public/logoapp.jpg and any
        // webfonts were silently excluded from precaching, meaning
        // they'd vanish from the UI the moment the device went offline
        // even though the rest of the app shell loaded fine.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico,woff,woff2}'],
        // Material Symbols' variable-weight woff2 font is ~4MB — bigger
        // than Workbox's default 2MB precache limit, which fails the
        // production build outright ("Configure
        // workbox.maximumFileSizeToCacheInBytes"). Raised to 6MB to
        // comfortably cover it plus any similar large static asset —
        // this must stay paired with the globPatterns fix above, since
        // widening file-type coverage without raising this limit just
        // trades "font missing from cache" for "build fails outright."
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Without this, opening any deep link (e.g. /resources/12/read)
        // while offline 404s instead of loading the app shell — the
        // service worker has index.html cached but doesn't know to serve
        // it for routes that aren't literally that file.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],

  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com']
  }
})