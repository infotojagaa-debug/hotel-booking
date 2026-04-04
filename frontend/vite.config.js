import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite HMR triggered by Antigravity to sync Tailwind classes
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@react-google-maps/api']
  }
})
