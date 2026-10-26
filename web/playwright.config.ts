import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 45_000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '../docs/week11/evidence/playwright-results.json' }],
    ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'),
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
