// Regenerates the committed Week 11 evidence (axe JSON, screenshots, results) in Chromium.
// Cross-platform replacement for setting EVIDENCE_DIR in the shell.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const evidence = path.resolve('..', 'docs', 'week11', 'evidence');
const run = spawnSync('npx', ['playwright', 'test', '--project=chromium'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, EVIDENCE_DIR: evidence },
});
process.exit(run.status ?? 1);
