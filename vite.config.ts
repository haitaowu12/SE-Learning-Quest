import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Relative assets support GitHub Pages projects, forks and custom-domain roots.
  base: './',
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
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
});
