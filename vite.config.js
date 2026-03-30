import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      // React calls /api/claude → Vite forwards to proxy-server.js on 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // TextBee proxy — ad blocker bypass
      '/textbee': {
        target: 'https://api.textbee.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/textbee/, ''),
      },
      // TextMeBot proxy — resolve CORS issues
      '/textmebot': {
        target: 'https://api.textmebot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/textmebot/, ''),
      },
    },
  },
})