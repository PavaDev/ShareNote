import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://newsiest-unprofessing-bryleigh.ngrok-free.dev',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://newsiest-unprofessing-bryleigh.ngrok-free.dev',
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