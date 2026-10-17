import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin in development: the session cookie stays first-party and no CORS is needed.
    proxy: {
      '/api': 'http://localhost:5175',
    },
  },
})
