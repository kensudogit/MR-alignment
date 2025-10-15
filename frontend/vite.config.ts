import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: false,
    cors: true,
    watch: {
      usePolling: true
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    assetsInlineLimit: 0,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios']
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*'
    }
  },
  define: {
    global: 'globalThis',
  },
  envPrefix: 'VITE_',
  envDir: '.'
})
