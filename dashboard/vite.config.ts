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
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            charts: ['chart.js', 'react-chartjs-2'],
            router: ['react-router-dom'],
            // AI components optimization
            'ai-core': [
              './src/design-system/components/ai/AIGeneratedContent',
              './src/design-system/components/ai/ConfidenceIndicator',
              './src/design-system/components/ai/SuggestionChip',
              './src/design-system/components/ai/ExplanationTooltip',
              './src/design-system/components/ai/LoadingStateIndicator',
            ],
            'ai-screens': [
              './src/pages/AICommunicationTrainingScreen',
              './src/pages/AIRiskAssessmentDashboard',
              './src/pages/EmergencyResponseCenterScreen',
              './src/pages/AIPersonalizationDashboard',
              './src/pages/DocumentVerificationStatusScreen',
              './src/pages/BuildingHealthMonitorScreen',
              './src/pages/AIInsightsDashboard',
              './src/pages/MarketIntelligenceScreen',
            ],
            'ai-utils': [
              './src/utils/ai-performance',
              './src/utils/analytics',
              './src/utils/monitoring',
            ],
          },
        },
        // Tree shaking optimization
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
        // Enable React Fast Refresh in development
        fastRefresh: !isProduction,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      open: true,
      host: true,
    },
    preview: {
      port: 3000,
      host: true,
    },
    define: {
      // Make environment variables available at build time
      __BUILD_DATE__: JSON.stringify(env.BUILD_DATE || new Date().toISOString()),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
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