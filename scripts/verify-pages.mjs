import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const pagesDirectory = path.join(process.cwd(), 'dist', 'pages');
const required = ['index.html', 'robots.txt', 'sitemap.xml', 'tcrs/index.html'];

for (const relativePath of required) {
  await access(path.join(pagesDirectory, relativePath));
}

const appHtml = await readFile(path.join(pagesDirectory, 'tcrs', 'index.html'), 'utf8');
if (!appHtml.includes('/kol-tools/tcrs/assets/')) {
  throw new Error('The TCRS client was not built with the /kol-tools/tcrs/ asset base.');
}
if (!appHtml.includes('http-equiv="Content-Security-Policy"')) {
  throw new Error('The TCRS client is missing its Content Security Policy.');
}
if (!appHtml.includes("connect-src 'self'")) {
  throw new Error('The TCRS client CSP must restrict data requests to the Pages origin.');
}

for (const page of ['index.html']) {
  const html = await readFile(path.join(pagesDirectory, page), 'utf8');
  if (!html.includes('http-equiv="Content-Security-Policy"')) {
    throw new Error(`${page} is missing its Content Security Policy.`);
  }
}

const rootFiles = await readdir(pagesDirectory, { recursive: true });
const forbidden = rootFiles.filter((entry) => /(?:server\.(?:cjs|js|map)|\.env|\.map$|\.log$)/i.test(entry));
if (forbidden.length) {
  throw new Error(`Server artifacts are present in the Pages directory: ${forbidden.join(', ')}`);
}

const dataManifest = JSON.parse(
  await readFile(path.join(pagesDirectory, 'tcrs', 'data', 'manifest.json'), 'utf8'),
);
if (dataManifest.version !== 2) {
  throw new Error('The Pages data manifest has an unsupported version.');
}
if (!Array.isArray(dataManifest.files) || dataManifest.files.length !== 162) {
  throw new Error(`Expected 162 allowlisted TCRS files, found ${dataManifest.files.length}.`);
}
if (!Array.isArray(dataManifest.sourceFiles) || dataManifest.sourceFiles.length !== 171) {
  throw new Error(`Expected 171 approved KoLmafia source files, found ${dataManifest.sourceFiles?.length}.`);
}
if (!/^[0-9a-f]{64}$/.test(dataManifest.dataFingerprint)) {
  throw new Error('The Pages data manifest is missing a valid data fingerprint.');
}
for (const file of [...dataManifest.files, dataManifest.referenceIndex, ...dataManifest.sourceFiles]) {
  if (
    !file ||
    typeof file.path !== 'string' ||
    !Number.isSafeInteger(file.bytes) ||
    file.bytes <= 0 ||
    !/^[0-9a-f]{64}$/.test(file.sha256)
  ) {
    throw new Error('The Pages data manifest contains invalid file metadata.');
  }
}
await access(path.join(pagesDirectory, 'tcrs', 'data', 'reference-data.json'));

console.log('GitHub Pages artifact structure is valid.');
