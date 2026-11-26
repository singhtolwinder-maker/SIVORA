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
