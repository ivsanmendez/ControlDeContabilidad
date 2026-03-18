import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiBase = process.env.VITE_API_BASE ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      maxParallelFileOps: 20,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/@remix-run/')) {
            return 'vendor-router'
          }
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n'
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['import', 'browser', 'module', 'default'],
  },
  server: {
    proxy: {
      '/auth': apiBase,
      '/expenses': {
        target: apiBase,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/contributors': {
        target: apiBase,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/contributions': {
        target: apiBase,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/contribution-categories': apiBase,
      '/expense-categories': apiBase,
      '/receipts': apiBase,
      '/reports': apiBase,
      '/health': apiBase,
    },
  },
})
