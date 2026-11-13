import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

declare const process: { env: Record<string, string | undefined> };

// The dev server forwards /api to a running Saturn service (default: the local one).
const backend = process.env.API_PROXY ?? 'http://127.0.0.1:9000';

export default defineConfig({
  plugins: [svelte()],
  build: { target: 'es2022', sourcemap: false },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: backend, changeOrigin: false } },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
