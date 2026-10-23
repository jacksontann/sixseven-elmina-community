import { defineConfig, devices } from '@playwright/test';

const PORT = 3300;

/**
 * Browser tests run against a production build (`npm run build` first) with an isolated database
 * directory, serially, because the specs share one sample community.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  webServer: {
    // Start from a fresh sample community every run.
    command: `node -e "require('fs').rmSync('.data/e2e-demo',{recursive:true,force:true})" && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { DATA_DIR: '.data/e2e-demo', DATABASE_URL: '', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});
