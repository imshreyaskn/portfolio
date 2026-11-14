import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    target: 'esnext',
    rolldownOptions: {
      output: {
        // Only modules matching a group's `test` go into that group. The old
        // `manualChunks` also swept in shared helpers (React included), so the
        // entry chunk ended up preloading all of three.js before the hero could
        // render. three.js now loads only with the lazy Skills/Projects sections.
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'framer', test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'three-vendor', test: /[\\/]node_modules[\\/](three|three-stdlib|@react-three|maath|@use-gesture|zustand|its-fine|suspend-react|react-use-measure)[\\/]/ },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion']
  }
})
