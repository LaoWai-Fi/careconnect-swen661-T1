// Lighthouse accessibility audit for every route, in mobile and desktop modes.
//
// Usage (two terminals, from the web folder):
//   Terminal 1: npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
//   Terminal 2: npm run lighthouse:accessibility
//
// Audit the deployed site instead (no preview server needed):
//   BASE_URL=https://<owner>.github.io/<repo>/ npm run lighthouse:accessibility
//
// Optional: LH_ONLY=landing,dashboard limits the routes, LH_MODES=desktop limits the modes,
// MIN_SCORE changes the pass mark (default 90), EVIDENCE_DIR changes where reports are written.
//
// The app uses a local demo session, so this script starts Chromium with a debugging port, stores the
// session on the site origin through that browser, and lets Lighthouse attach to the same browser
// (--port) without clearing storage. Lighthouse runs through npx, so it is not added to package.json.
// Reports go to test-results/lighthouse by default. Exit code 1 if any score is below MIN_SCORE.
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const base = new URL((process.env.BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/'));
const minScore = Number(process.env.MIN_SCORE || 90);
const port = Number(process.env.CDP_PORT || 9333);
const outDir = path.resolve(process.env.EVIDENCE_DIR || 'test-results', 'lighthouse');
const modes = (process.env.LH_MODES || 'mobile,desktop').split(',');
const only = process.env.LH_ONLY ? process.env.LH_ONLY.split(',') : null;
const allRoutes = [
  ['landing', ''], ['signin', 'signin'], ['signup', 'signup'],
  ['dashboard', 'app'], ['medications', 'app/manage-medications'], ['appointments', 'app/manage-appointments'],
  ['activity', 'app/activity'], ['messages', 'app/messages'], ['compose', 'app/messages/compose'],
  ['notes', 'app/caregiver'], ['contacts', 'app/contacts'], ['settings', 'app/settings'],
];
const routes = only ? allRoutes.filter(([name]) => only.includes(name)) : allRoutes;
const session = JSON.stringify({ user: { id: 'lighthouse', name: 'Dom Demo', email: 'lighthouse@example.com' } });

await mkdir(outDir, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'careconnect-lighthouse-'));
const chromeArgs = ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'];
if (process.getuid?.() === 0) chromeArgs.unshift('--no-sandbox');
const chrome = spawn(process.env.CHROME_PATH || chromium.executablePath(), chromeArgs, { stdio: 'ignore' });

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) return; } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Chromium did not open debugging port ${port}. Is something else using it? Set CDP_PORT to change it.`);
}

// Playwright is connected only while the session is written, then disconnected. Staying connected while
// Lighthouse runs would leave the new Lighthouse tab paused waiting for this script (spawnSync blocks it).
async function setSession(signedIn) {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  try {
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    if (!page.url().startsWith(base.origin)) await page.goto(base.href);
    await page.evaluate(([value]) => {
      if (value) localStorage.setItem('careconnect_session', value); else localStorage.removeItem('careconnect_session');
    }, [signedIn ? session : null]);
  } finally {
    await browser.close(); // disconnects only; the Chromium process keeps running
  }
}

const rows = [];
try {
  await waitForChrome();
  for (const mode of modes) {
    for (const [name, route] of routes) {
      // Signed-in users are redirected away from the public pages, so audit those signed out.
      const signedOut = ['', 'signin', 'signup'].includes(route);
      await setSession(!signedOut);
      const target = new URL(route, base).href;
      const outputPath = path.join(outDir, `lighthouse-${name}-${mode}`);
      const args = ['--yes', 'lighthouse@12', target, `--port=${port}`, '--only-categories=accessibility',
        '--disable-storage-reset', '--no-enable-error-reporting', '--quiet',
        '--output=json', '--output=html', `--output-path=${outputPath}`];
      if (mode === 'desktop') args.push('--preset=desktop');
      console.log(`Auditing ${name} (${mode})...`);
      const run = spawnSync('npx', args, { stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' });
      if (run.status !== 0) { rows.push({ name, mode, score: 'ERROR', failed: [] }); continue; }
      const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'));
      const failed = Object.values(report.audits).filter((a) => a.score === 0 && a.scoreDisplayMode === 'binary').map((a) => a.id);
      rows.push({ name, mode, score: Math.round(report.categories.accessibility.score * 100), failed });
    }
  }
} finally {
  chrome.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

console.log('\nLighthouse accessibility scores (minimum ' + minScore + ')');
for (const r of rows) console.log(`${String(r.score).padStart(5)}  ${r.mode.padEnd(8)} ${r.name.padEnd(13)} ${r.failed.join(', ')}`);
const bad = rows.filter((r) => r.score === 'ERROR' || r.score < minScore);
console.log(bad.length ? `\n${bad.length} run(s) below ${minScore} or failed.` : '\nAll runs meet the minimum.');
console.log(`Reports: ${outDir}`);
process.exit(bad.length ? 1 : 0);
