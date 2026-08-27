import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      target: 'chrome60',
    },
    build: {
      target: ['es2015', 'chrome60'],
      cssTarget: 'chrome60',
      cssMinify: 'lightningcss' as const,
    },
    css: {
      transformer: 'lightningcss' as const,
      lightningcss: {
        targets: {
          chrome: 60 << 16,
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
