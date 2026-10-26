import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const evidence = path.resolve('../docs/week11/evidence');
await mkdir(evidence, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { windowsHide: true });
let browser;
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Preview exited ${code}`))); });
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium') });
  const screens = [['dashboard', '/app'], ['medications', '/app/manage-medications'], ['appointments', '/app/manage-appointments'], ['messages', '/app/messages'], ['settings', '/app/settings']];
  for (const width of [375, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('careconnect_session', JSON.stringify({ user: { id: 'wk11-evidence', name: 'Wiliss Demo', email: 'demo@example.com' } })));
    for (const [name, route] of screens) {
      await page.goto(`http://127.0.0.1:4186${route}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.screenshot({ path: path.join(evidence, `viewport-${name}-${width}.png`) });
    }
    await context.close();
  }
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.goto(pathToFileURL(path.resolve('coverage/lcov-report/index.html')).href);
  await page.screenshot({ path: path.join(evidence, 'coverage-summary.png'), fullPage: true });
  const jest = JSON.parse(await readFile(path.join(evidence, 'jest-results.json'), 'utf8'));
  const playwright = JSON.parse(await readFile(path.join(evidence, 'playwright-results.json'), 'utf8'));
  const install = JSON.parse(await readFile(path.join(evidence, 'pwa-installability.json'), 'utf8'));
  if (!jest.success || playwright.stats.unexpected || install.manifestErrors.length || install.installabilityErrors.length) throw new Error('Evidence must reflect passing runs.');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Week 11 measured results</title><style>body{font:20px/1.6 system-ui;background:#f7f8fa;color:#1e2631;padding:36px}h1{font-size:30px}pre{font-size:17px;white-space:pre-wrap}section{background:white;padding:20px;border:1px solid #b4becb;margin:18px 0}</style><h1>CareConnect Week 11 measured results</h1><p>Generated summary of the raw reports included alongside this image.</p><section><h2>Automated tests</h2><p>Jest and React Testing Library: ${jest.numPassedTests} passed, ${jest.numFailedTests} failed, ${jest.numPassedTestSuites} suites.</p><p>Playwright: ${playwright.stats.expected} passed, ${playwright.stats.unexpected} failed, ${playwright.stats.skipped} skipped.</p></section><section><h2>Browser installability diagnostics</h2><pre>${JSON.stringify(install, null, 2)}</pre><p>Dedicated non-private browser profile on localhost. This is not an Android OS installation test.</p></section>`;
  await writeFile(path.join(evidence, 'measured-results.html'), html);
  await page.setContent(html);
  await page.screenshot({ path: path.join(evidence, 'measured-results.png'), fullPage: true });
  console.log('Saved 15 viewport images, the actual Jest coverage HTML capture and the measured-results summary.');
} finally { await browser?.close(); server.kill(); }
