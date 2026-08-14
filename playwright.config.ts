import { defineConfig, devices } from '@playwright/test';

/// <reference path="./node_modules/@playwright/test/types.d.ts" />

/**
 * Playwright config for the end-to-end suite.
 *
 * npm start boots json-server on port 3000 and ng serve on port 4200
 * via concurrently. Playwright will start it on demand and wait for
 * the dev server URL to respond before running tests.
 *
 * reuseExistingServer keeps the dev server alive between local re-runs
 * so we do not pay the cold-start cost every time.
 *
 * Tests live under e2e/, NOT under src/, so Vitest does not pick them
 * up. The Vitest tsconfig only globs for .spec.ts files inside src.
 *
 * A single chromium worker is used because the mock backend shares
 * state in db.json; parallel workers would race.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
