import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const item of ['index.html', 'src', 'public/USER_MANUAL.md']) {
  cpSync(resolve(root, item), resolve(dist, item.startsWith('public/') ? 'USER_MANUAL.md' : item), { recursive: true });
}
console.log('Static site prepared in dist/ (no external build dependencies).');