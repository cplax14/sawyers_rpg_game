import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['framer-motion']
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@game': resolve(__dirname, './js'),
      '@data': resolve(__dirname, './data'),
      '@assets': resolve(__dirname, './assets'),
      '@css': resolve(__dirname, './css')
    }
  },
  server: {
    port: 3000,
    open: true,
    // Serve static files from root for compatibility with existing game assets
    fs: {
      allow: ['.']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Copy game assets and data files
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Ensure CSS and other static assets are handled properly
  assetsInclude: ['**/*.css', '**/*.png', '**/*.jpg']
})