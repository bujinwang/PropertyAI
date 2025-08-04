import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    root: 'src',
    publicDir: '../public',
    build: {
      outDir: '../build',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@mui')) {
                return 'vendor-mui';
              }
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'vendor-charts';
              }
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              if (id.includes('lodash')) {
                return 'vendor-utils';
              }
              return 'vendor-other';
            }
            return 'main';
          },
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      react({
        fastRefresh: !isProduction,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3002, // Use port 3002 for frontend
      host: '127.0.0.1',
      strictPort: false,
      hmr: {
        port: 24679, // Different HMR port
        host: '127.0.0.1',
      },
      cors: true,
    },
    preview: {
      port: 3002, // Change from 3000 to 3002 to match server port
      host: true,
    },
    define: {
      __BUILD_DATE__: JSON.stringify(env.BUILD_DATE || new Date().toISOString()),
      __VERSION__: JSON.stringify(env.npm_package_version || '0.1.0'),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    // Enable gzip compression in production
    ...(isProduction && {
      build: {
        ...{
          outDir: '../build',
          emptyOutDir: true,
          sourcemap: false,
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
          rollupOptions: {
            output: {
              manualChunks: {
                vendor: ['react', 'react-dom'],
                mui: ['@mui/material', '@mui/icons-material'],
                charts: ['chart.js', 'react-chartjs-2'],
                router: ['react-router-dom'],
              },
            },
          },
          chunkSizeWarningLimit: 1000,
        },
        reportCompressedSize: true,
      },
    }),
  };
});