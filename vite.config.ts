import { defineConfig } from 'vite';

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
      '@': '/src',
      '@assets': '/public/assets',
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
});
