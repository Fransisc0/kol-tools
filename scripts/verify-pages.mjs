import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const pagesDirectory = path.join(process.cwd(), 'dist', 'pages');
const required = ['index.html', 'privacy.html', 'robots.txt', 'sitemap.xml', 'tcrs/index.html'];

for (const relativePath of required) {
  await access(path.join(pagesDirectory, relativePath));
}

const appHtml = await readFile(path.join(pagesDirectory, 'tcrs', 'index.html'), 'utf8');
if (!appHtml.includes('/kol-tools/tcrs/assets/')) {
  throw new Error('The TCRS client was not built with the /kol-tools/tcrs/ asset base.');
}

const rootFiles = await readdir(pagesDirectory, { recursive: true });
const forbidden = rootFiles.filter((entry) => /server\.(?:cjs|js|map)$/i.test(entry));
if (forbidden.length) {
  throw new Error(`Server artifacts are present in the Pages directory: ${forbidden.join(', ')}`);
}

console.log('GitHub Pages artifact structure is valid.');
