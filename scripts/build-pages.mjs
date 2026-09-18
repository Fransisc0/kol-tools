import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const pagesDirectory = path.join(root, 'dist', 'pages');

await mkdir(pagesDirectory, { recursive: true });
await cp(path.join(root, 'site'), pagesDirectory, { recursive: true, force: true });
await cp(path.join(root, 'public', 'favicon.svg'), path.join(pagesDirectory, 'favicon.svg'), {
  force: true,
});

console.log('Assembled GitHub Pages site in dist/pages.');
