import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/acceptance.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/SE-Learning-Quest/',
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: 'node scripts/serve-production.mjs',
    url: 'http://127.0.0.1:4173/SE-Learning-Quest/',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
