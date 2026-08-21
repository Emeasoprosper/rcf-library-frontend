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
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        // FIX (root cause of "This resource couldn't be opened" for
        // PDFs specifically, while offline): pdf.js loads its worker
        // script as a separate file at runtime — built as
        // pdf.worker.min-XXXX.mjs. The .mjs extension was missing from
        // this list, so Workbox never precached that ~1.2MB file. With
        // zero network, the moment a downloaded PDF tried to initialize
        // pdf.js, fetching the worker script failed outright, the whole
        // load rejected, and the reader showed a hard error — even
        // though the actual PDF file itself was sitting safely in
        // IndexedDB the whole time. Audio/video don't need this file at
        // all (no separate worker), which is why only PDFs were
        // affected.
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,jpg,jpeg,webp,ico,woff,woff2}'],
        // Material Symbols' variable-weight woff2 font is ~4MB — bigger
        // than Workbox's default 2MB precache limit, which fails the
        // production build outright ("Configure
        // workbox.maximumFileSizeToCacheInBytes"). Raised to 6MB —
        // comfortably covers that font plus the ~1.2MB pdf.js worker
        // now included above.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        // /s/ tokens still fall through to index.html like everything
        // else here (that's correct — ShareRedirect.jsx needs the SPA
        // shell to mount) — this denylist only ever needs to exclude
        // truly non-SPA routes like /api/. Left as-is; noting it here
        // since /s/ came up in this debugging pass, so it's confirmed
        // NOT excluded.
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],

  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com']
  }
})