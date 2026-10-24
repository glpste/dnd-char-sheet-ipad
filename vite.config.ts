/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  // iPad 4 / iOS 10.3 (Safari 10.1) target: ship only the ES5 + SystemJS bundle and
  // make Lightning CSS downlevel colours, media ranges and shorthands. See scripts/check-legacy.mjs.
  plugins: [react(), legacy({ targets: ['ios >= 10', 'safari >= 10'], renderModernChunks: false })],
  build: { cssTarget: ['safari10', 'ios10'] },
  css: { lightningcss: { targets: { safari: 10 << 16, ios_saf: 10 << 16 } } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
