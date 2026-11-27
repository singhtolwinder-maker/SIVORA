import path from 'node:path'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.VITE_API_PROXY || 'http://127.0.0.1:4000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the runtime and the animation engine in their own long-lived
        // chunks. They change far less often than the site itself, so returning
        // visitors re-download only the app code, and the lazily loaded admin
        // route reuses the same cached vendor chunks instead of fetching a
        // second copy of React.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/.test(id)) {
            return 'motion'
          }
          return undefined
        },
      },
    },
  },
  server: {
    // Bind the loopback address explicitly. Vite's default `localhost` resolves
    // to IPv6 ::1 on Windows, which makes http://127.0.0.1:5173 refuse
    // connections and hides the real cause behind client-side network errors.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Keeps the browser same-origin in development, so httpOnly session
    // cookies work without cross-site cookie rules.
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: false,
        // A proxy failure is reported as 502 by Vite. Log the underlying
        // reason instead of leaving the browser with an unexplained status.
        configure(proxy) {
          proxy.on('error', (error) => {
            console.error(
              `[vite] /api proxy could not reach ${apiTarget} (${error.code || error.message}). ` +
                'Start the API with `cd backend && npm run dev`.',
            )
          })
        },
      },
    },
  },
})
