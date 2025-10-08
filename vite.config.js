import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://protestable-combinatorial-thomas.ngrok-free.dev',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://protestable-combinatorial-thomas.ngrok-free.dev',
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