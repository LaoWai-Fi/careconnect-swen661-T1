import { defineConfig } from '@playwright/test'

// Real Electron end-to-end tests (Playwright _electron). Run `npm run build` first
// (the test:e2e script does), and use xvfb-run on a headless Linux machine.
export default defineConfig({
  testDir: 'test/e2e',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
})
