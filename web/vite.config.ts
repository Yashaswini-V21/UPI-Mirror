import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: {
    port: 5173,
    proxy: {
      '/upload': { target: 'http://localhost:8000', changeOrigin: true },
      '/coach':  { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/metrics':{ target: 'http://localhost:8000', changeOrigin: true },
      '/scenario':{ target: 'http://localhost:8000', changeOrigin: true },
      '/feedback':{ target: 'http://localhost:8000', changeOrigin: true },
      '/sessions':{ target: 'http://localhost:8000', changeOrigin: true },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 600, // recharts is ~500KB — known, acceptable
    rollupOptions: {
      output: {
        // Manual chunk splitting — vendors in separate cacheable chunks
        manualChunks: {
          'vendor-react':   ['react', 'react-dom'],
          'vendor-motion':  ['framer-motion'],
          'vendor-charts':  ['recharts'],
          'vendor-store':   ['zustand'],
          'vendor-toast':   ['react-hot-toast'],
        },
      },
    },
  },
});