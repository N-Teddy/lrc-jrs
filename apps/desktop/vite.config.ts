import path from 'node:path';
import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const nodeEnv =
    process.env.NODE_ENV ||
    (mode === 'production' ? 'production' : 'development');

  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      __DEV__: nodeEnv === 'development',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@jrs/client-core': path.resolve(
          import.meta.dirname,
          '../../packages/client-core/src/index.ts',
        ),
        '@jrs/shared': path.resolve(
          import.meta.dirname,
          '../../packages/shared/src/index.ts',
        ),
      },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
            protocol: 'ws',
            host,
            port: 1421,
          }
        : {
            protocol: 'ws',
            host: 'localhost',
            port: 1420,
          },
      watch: {
        // 3. tell Vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**'],
      },
    },
  };
});
