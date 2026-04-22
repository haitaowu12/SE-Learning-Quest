import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/SE-Learning-Quest/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
});
