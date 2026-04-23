import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Base path for deployment (e.g., '/subdirectory/' or '/' for root)
  // Set VITE_BASE_PATH environment variable to override
  base: process.env.VITE_BASE_PATH || '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for production (sourcemap: true for debugging)
    sourcemap: mode === 'development',

    // Minify using esbuild (built into Vite, faster than terser)
    minify: 'esbuild',

    // Target modern browsers
    target: 'es2020',

    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 1000,

    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-hook-form'],
          // UI components chunk
          'ui': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },

  // Server configuration
  server: {
    port: 5173,
    host: true,
    // Open browser on dev server start
    open: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-hook-form'],
  },
}))
