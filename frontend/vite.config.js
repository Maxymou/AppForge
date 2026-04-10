import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Brand colors — keep these in sync with index.css (--bg-main) and the <meta
// name="theme-color"> tag in index.html. background_color in particular must
// match the painted shell background so the PWA splash screen and install
// prompts never flash an unexpected color on Android / iOS.
const THEME_COLOR = '#090d16'
const BACKGROUND_COLOR = '#090d16'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: SW updates in the background; no "reload" prompt required.
      registerType: 'autoUpdate',
      // Inject the SW registration through the virtual module in main.jsx,
      // rather than having the plugin inject an inline <script> into index.html.
      injectRegister: null,
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png'
      ],
      manifest: {
        name: 'AppForge',
        short_name: 'AppForge',
        description: 'Visual application builder — roadmap, flows and architecture.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: BACKGROUND_COLOR,
        theme_color: THEME_COLOR,
        lang: 'en',
        categories: ['productivity', 'developer'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache the app shell so the PWA is installable and works offline
        // for the static assets. API calls stay network-first (below).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        navigateFallback: '/index.html',
        // Never intercept API requests with the navigation fallback.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheet
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // API — always try network first, fall back to cache if offline
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'appforge-api',
              networkTimeoutSeconds: 6,
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        // Enable the SW in `vite dev` so we can validate installability during
        // development. Keep `type: 'module'` for modern browsers.
        enabled: false,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
