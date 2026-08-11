import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    restoreMocks: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/automation': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 1_800_000,
      },
      '/auth': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
    },
  },
});
