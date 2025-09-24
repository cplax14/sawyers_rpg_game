import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Vite config for the pure React version
export default defineConfig({
  plugins: [react()],

  // Optimized dependencies
  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom']
  },

  // CSS configuration - TEMPORARY WORKAROUND: Disable CSS modules due to PostCSS parsing issues
  // TODO: Debug why PostCSS interprets CSS comments as "export" statements in React config
  // css: {
  //   modules: {
  //     localsConvention: 'camelCaseOnly',
  //     generateScopedName: '[name]__[local]___[hash:base64:5]'
  //   }
  // },

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
      '@assets': resolve(__dirname, './src/assets'),
      '@data': resolve(__dirname, './public/data')
    }
  },

  // Development server configuration
  server: {
    port: 3001, // Different port from hybrid version
    open: '/index-react.html', // Open React HTML file
    host: true, // Allow external access
    fs: {
      allow: ['.'] // Allow serving files from root
    }
  },

  // Build configuration
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
    sourcemap: true,

    // Performance optimizations
    chunkSizeWarningLimit: 1000,

    // Code splitting configuration
    rollupOptions: {
      input: resolve(__dirname, 'index-react.html'),
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],

          // App chunks
          'components-atoms': [
            './src/components/atoms/index.ts'
          ],
          'components-molecules': [
            './src/components/molecules/index.ts'
          ],
          'components-organisms': [
            './src/components/organisms/index.ts'
          ],
          'game-state': [
            './src/contexts/ReactGameContext.tsx',
            './src/hooks/index.ts'
          ],
          'game-data': [
            './src/utils/dataLoader.ts',
            './src/utils/validation.ts'
          ]
        }
      }
    }
  },

  // Include game assets and data files
  assetsInclude: ['**/*.css', '**/*.png', '**/*.jpg', '**/*.svg', '**/*.js'],

  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // Preview configuration
  preview: {
    port: 4001,
    host: true,
    open: '/index-react.html'
  }
})