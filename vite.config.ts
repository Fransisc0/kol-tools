import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    base: isProduction ? '/kol-tools/tcrs/' : '/',
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist/pages/tcrs',
      emptyOutDir: true,
      sourcemap: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : { ignored: ['**/data/**', '**/public/data/**', '**/dist/**', '**/scripts/legacy/**'] },
    },
  };
});
