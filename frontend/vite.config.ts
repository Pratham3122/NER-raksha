import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this app from /NER-raksha/, while local development
  // continues to run from the site root.
  base: process.env.GITHUB_ACTIONS ? '/NER-raksha/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  resolve: {
    alias: { '@': '/src' },
  },
})
