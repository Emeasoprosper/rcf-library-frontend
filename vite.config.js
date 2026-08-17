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

      // Reuses the icon files already in public/
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png'
      ],

      manifest: {
        name: 'RCF MOUAU Digital Library',
        short_name: 'RCF Library',
        description:
          'Books, past questions, devotionals, and study resources for RCF MOUAU students.',
        theme_color: '#000000',
        background_color: '#0A0A0A',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      // Basic offline app-shell caching.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],

  // Allow the temporary Cloudflare Tunnel hostname.
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com']
  }
})