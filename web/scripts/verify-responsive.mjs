// Compatibility entrypoint. The maintained tests include boundary-width checks.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, 'test', '--grep', 'responsive'], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
