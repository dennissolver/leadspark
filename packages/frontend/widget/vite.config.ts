import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: path.resolve(__dirname, '../../ui/tailwind.config.js'),
        }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 3003,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    lib: {
      entry: path.resolve(__dirname, 'src/widget-standalone.ts'),
      name: 'LeadsparkWidget',
      fileName: 'leadspark-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'leadspark-widget.js',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
  },
});