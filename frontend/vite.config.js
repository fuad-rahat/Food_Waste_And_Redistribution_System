import { defineConfig } from 'vite'

// ...existing code...

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://food-waste-and-redistribution-syste.vercel.app/',
        changeOrigin: true,
        secure: false
      }
    }
  }
})