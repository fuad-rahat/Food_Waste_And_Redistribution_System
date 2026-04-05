import { defineConfig, loadEnv } from 'vite'
import api from './src/api'

// We wrap in a function to access the 'mode' (e.g., development, production)
// and load the matching environment variables into process.env.
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    server: {
      proxy: {
        '/api': {
          target: api.defaults.baseURL,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})