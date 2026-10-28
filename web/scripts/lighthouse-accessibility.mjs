// Lighthouse accessibility audit for every route, in mobile and desktop modes.
//
// Usage:
//   npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort   (terminal 1)
//   npm run lighthouse:accessibility                                                          (terminal 2)
//
// Audit the deployed site instead:
//   BASE_URL=https://<owner>.github.io/<repo>/ npm run lighthouse:accessibility
//
// The app uses a local demo session, so Playwright launches Chromium, stores that session on the site
// origin, and Lighthouse attaches to the same browser (--port) without clearing storage. Lighthouse itself
// runs through npx, so it is not added to package.json. Reports go to test-results/lighthouse by default;
// set EVIDENCE_DIR to write them elsewhere. Exit code 1 if any score is below MIN_SCORE (default 90).
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const base = new URL((process.env.BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/'));
const minScore = Number(process.env.MIN_SCORE || 90);
const port = Number(process.env.CDP_PORT || 9333);
const outDir = path.resolve(process.env.EVIDENCE_DIR || 'test-results', 'lighthouse');
const modes = (process.env.LH_MODES || 'mobile,desktop').split(',');
const routes = [
  ['landing', ''], ['signin', 'signin'], ['signup', 'signup'],
  ['dashboard', 'app'], ['medications', 'app/manage-medications'], ['appointments', 'app/manage-appointments'],
  ['activity', 'app/activity'], ['messages', 'app/messages'], ['compose', 'app/messages/compose'],
  ['notes', 'app/caregiver'], ['contacts', 'app/contacts'], ['settings', 'app/settings'],
];

await mkdir(outDir, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'careconnect-lighthouse-'));
const context = await chromium.launchPersistentContext(profile, {
  headless: true,
  args: [`--remote-debugging-port=${port}`],
});
const rows = [];
try {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(base.href);
  await page.evaluate(() => localStorage.setItem('careconnect_session', JSON.stringify({
    user: { id: 'lighthouse', name: 'Dom Demo', email: 'lighthouse@example.com' },
  })));
  // Signed-in users are redirected away from /signin and /signup, so audit those two signed out.
  for (const mode of modes) {
    for (const [name, route] of routes) {
      const signedOut = ['', 'signin', 'signup'].includes(route);
      await page.evaluate((out) => {
        if (out) localStorage.removeItem('careconnect_session');
        else localStorage.setItem('careconnect_session', JSON.stringify({ user: { id: 'lighthouse', name: 'Dom Demo', email: 'lighthouse@example.com' } }));
      }, signedOut);
      const target = new URL(route, base).href;
      const outputPath = path.join(outDir, `lighthouse-${name}-${mode}`);
      const args = ['--yes', 'lighthouse@12', target, `--port=${port}`, '--only-categories=accessibility',
        '--disable-storage-reset', '--no-enable-error-reporting', '--quiet', '--output=json', '--output=html', `--output-path=${outputPath}`];
      if (mode === 'desktop') args.push('--preset=desktop');
      const run = spawnSync('npx', args, { stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' });
      if (run.status !== 0) { rows.push({ name, mode, score: 'ERROR', failed: [] }); continue; }
      const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'));
      const failed = Object.values(report.audits).filter((a) => a.score === 0 && a.scoreDisplayMode === 'binary').map((a) => a.id);
      rows.push({ name, mode, score: Math.round(report.categories.accessibility.score * 100), failed });
    }
  }
} finally {
  await context.close();
}

console.log('\nLighthouse accessibility scores (minimum ' + minScore + ')');
for (const r of rows) console.log(`${String(r.score).padStart(5)}  ${r.mode.padEnd(8)} ${r.name.padEnd(13)} ${r.failed.join(', ')}`);
const bad = rows.filter((r) => r.score === 'ERROR' || r.score < minScore);
console.log(bad.length ? `\n${bad.length} run(s) below ${minScore} or failed.` : '\nAll runs meet the minimum.');
console.log(`Reports: ${outDir}`);
process.exit(bad.length ? 1 : 0);
