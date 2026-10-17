import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin in development: the session cookie stays first-party and no CORS is needed.
    // API_URL lets you point the dev server at another API instance.
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:5175',
    },
  },
})
