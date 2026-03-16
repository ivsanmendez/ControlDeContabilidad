import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
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
      '/auth': 'http://localhost:8080',
      '/expenses': 'http://localhost:8080',
      '/contributors': {
        target: 'http://localhost:8080',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/contributions': {
        target: 'http://localhost:8080',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/contribution-categories': 'http://localhost:8080',
      '/expense-categories': 'http://localhost:8080',
      '/receipts': 'http://localhost:8080',
      '/reports': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    },
  },
})
