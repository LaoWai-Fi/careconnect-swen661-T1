import { createHash } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
async function files(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? files(path.join(directory, entry.name), `${prefix}${entry.name}/`)
    : `${prefix}${entry.name}`));
  return nested.flat();
}
// Entries are relative to the deployment base; the worker resolves them against its scope.
const precache = ['index.html', 'manifest.webmanifest'];
for (const directory of ['assets', 'icons']) {
  precache.push(...(await files(path.join(dist, directory))).map((file) => `${directory}/${file}`));
}
precache.sort();
const template = await readFile(path.join(root, 'public', 'sw.js'), 'utf8');
const hash = createHash('sha256').update(template);
for (const file of precache) hash.update(file).update(await readFile(path.join(dist, file)));
const buildId = hash.digest('hex').slice(0, 16);
const worker = template.replace('__CC_BUILD_ID__', buildId)
  .replace('/*__CC_PRECACHE__*/[]', JSON.stringify(precache));
await writeFile(path.join(dist, 'sw.js'), worker);
// Static hosts such as GitHub Pages have no SPA fallback: a direct link to an app route
// returns 404.html, so serve the same app shell there and let the router take over.
await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'));
console.log(`PWA release ${buildId}: ${precache.length} static files precached.`);
