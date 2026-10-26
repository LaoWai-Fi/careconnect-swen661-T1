import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Routine runs write results to test-results/ (git-ignored). Set EVIDENCE_DIR, or run
// `npm run test:e2e:evidence`, to regenerate the committed evidence under docs/.
const resultsFile = path.resolve(process.env.EVIDENCE_DIR || 'test-results', 'playwright-results.json');

export default defineConfig({
  testDir: './test',
  timeout: 45_000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: resultsFile }], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'),
      },
    },
    // Install and offline-cache behaviour is verified in Chromium, where installability is defined.
    { name: 'firefox', use: { browserName: 'firefox' }, grepInvert: /PWA/ },
    { name: 'webkit', use: { browserName: 'webkit' }, grepInvert: /PWA/ },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
