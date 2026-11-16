import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@jrs/shared': path.resolve(
        import.meta.dirname,
        '../../packages/shared/src/index.ts',
      ),
      '@jrs/api-client': path.resolve(
        import.meta.dirname,
        '../../packages/api-client/src/index.ts',
      ),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
    legalComments: 'none',
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        changeOrigin: true,
      },
    },
  },
}));
