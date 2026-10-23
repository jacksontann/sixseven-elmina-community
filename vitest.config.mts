import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Run every test in UTC so time-zone bugs cannot hide behind a Malaysian laptop clock.
process.env.TZ = 'UTC';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    include: ['tests/domain/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    env: { TZ: 'UTC' },
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': root,
      'server-only': fileURLToPath(new URL('./tests/helpers/server-only-stub.ts', import.meta.url)),
    },
  },
});
