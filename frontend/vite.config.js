import { defineConfig } from 'vite'

// ...existing code...

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://foodrescuebd-backend.vercel.app/',
        changeOrigin: true,
        secure: false
      }
    }
  }
})