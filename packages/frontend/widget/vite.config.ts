import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Base configuration
  const baseConfig = {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use 'packages/styles/main.scss' as *;`, // Inject globally
          includePaths: [path.resolve(__dirname, '../../')],
        },
      },
    },
    resolve: {
      alias: {
        '@styles': path.resolve(__dirname, '../../packages/styles'),
      },
    },
  };

  // If building for standalone widget
  if (mode === 'standalone') {
    return {
      ...baseConfig,
      build: {
        lib: {
          entry: 'src/widget-standalone.ts',
          name: 'LeadsparkWidget',
          fileName: 'leadspark-widget',
          formats: ['iife'] // Immediately Invoked Function Expression for browser
        },
        rollupOptions: {
          external: [], // Bundle everything including React
          output: {
            globals: {}
          }
        },
        outDir: '../../landing-page/public', // Output directly to landing page public folder
        emptyOutDir: false
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    };
  }

  // Default development configuration
  return baseConfig;
});