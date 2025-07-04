import path from "path"
import { VitePWA } from "vite-plugin-pwa"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'icons/*.png', 'test-climbing-photo-1.jpg', 'test-climbing-photo-2.png'],
      manifest: {
        name: 'CRAg',
        short_name: 'CRAg',
        description: 'An app to annotate climbing photos with routes and beta.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    sentryVitePlugin({
      org: "na-23z",
      project: "crag-one-vercel",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      '.ts.net',
      '.ngrok-free.app',
    ],
  },

})

