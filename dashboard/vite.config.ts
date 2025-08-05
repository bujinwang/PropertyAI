import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // root: 'src', // This can cause routing issues, so we remove it.
  publicDir: './public',
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3002,
    host: '127.0.0.1',
    // Allow Vite to manage HMR (default true). Optionally specify port explicitly:
    // hmr: { host: '127.0.0.1', port: 3002 },
    cors: true,
    watch: {
      usePolling: false,
    },
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
});