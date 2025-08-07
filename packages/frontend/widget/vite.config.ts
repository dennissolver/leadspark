// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
});
