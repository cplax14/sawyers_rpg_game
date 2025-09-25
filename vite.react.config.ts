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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('uuid')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }

          // Component chunks (lazy loaded)
          if (id.includes('organisms/MainMenu')) {
            return 'lazy-main-menu';
          }
          if (id.includes('organisms/CharacterSelection')) {
            return 'lazy-character-selection';
          }
          if (id.includes('organisms/WorldMap')) {
            return 'lazy-world-map';
          }
          if (id.includes('organisms/SaveLoadManager')) {
            return 'lazy-save-system';
          }
          if (id.includes('molecules/SaveSlotCard')) {
            return 'lazy-save-system';
          }

          // Core app chunks
          if (id.includes('components/atoms')) {
            return 'components-atoms';
          }
          if (id.includes('components/molecules')) {
            return 'components-molecules';
          }
          if (id.includes('hooks') || id.includes('contexts')) {
            return 'game-state';
          }
          if (id.includes('utils/saveSystemManager') || id.includes('utils/indexedDbManager')) {
            return 'save-system-core';
          }
          if (id.includes('utils/dataLoader') || id.includes('types')) {
            return 'game-data';
          }
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