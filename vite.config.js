import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://prolific-recreation-production.up.railway.app',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://prolific-recreation-production.up.railway.app',
        changeOrigin: true
      }
    },
    build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
  }
})