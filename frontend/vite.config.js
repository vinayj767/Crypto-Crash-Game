import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Hardcode the production API URL for Netlify
    'import.meta.env.VITE_API_URL': JSON.stringify('https://crypto-crash-game-h8w6.onrender.com')
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
