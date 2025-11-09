import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Proxy only used in development when VITE_API_URL is not set
    proxy: process.env.VITE_API_URL
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
        },
  },
})

