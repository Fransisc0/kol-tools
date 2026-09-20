import { createHash } from 'node:crypto';
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
const forbidden = rootFiles.filter((entry) =>
  /(?:server\.(?:cjs|js|map)|\.env|\.map$|\.log$|\.sqlite$|\.java$|(?:^|\/)TCRS_[^/]+\.txt$)/i.test(entry),
);
if (forbidden.length) {
  throw new Error(`Server artifacts are present in the Pages directory: ${forbidden.join(', ')}`);
}

const dataManifest = JSON.parse(
  await readFile(path.join(pagesDirectory, 'tcrs', 'data', 'manifest.json'), 'utf8'),
);
if (dataManifest.version !== 3) {
  throw new Error('The Pages data manifest has an unsupported version.');
}
if (!Array.isArray(dataManifest.files) || dataManifest.files.length !== 54) {
  throw new Error(`Expected 54 generated TCRS datasets, found ${dataManifest.files?.length}.`);
}
if (!Array.isArray(dataManifest.sourceFiles) || dataManifest.sourceFiles.length < 20) {
  throw new Error('The approved source inventory is incomplete.');
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
if (
  dataManifest.referenceIndex.path !== 'reference-data.json' ||
  dataManifest.files.some((file) => !/^generated\/TCRS_[A-Za-z_]+_[A-Za-z_]+\.json$/.test(file.path))
) {
  throw new Error('The Pages data manifest contains an unsafe asset path.');
}
await access(path.join(pagesDirectory, 'tcrs', 'data', 'reference-data.json'));

const dataDirectory = path.join(pagesDirectory, 'tcrs', 'data');
const dataFiles = (await readdir(dataDirectory, { recursive: true })).filter(
  (entry) => !entry.endsWith('generated'),
);
const expectedFiles = new Set([
  'manifest.json',
  'reference-data.json',
  ...dataManifest.files.map((file) => file.path.replaceAll('\\', '/')),
]);
if (
  dataFiles.length !== expectedFiles.size ||
  dataFiles.some((file) => !expectedFiles.has(file.replaceAll('\\', '/')))
) {
  throw new Error('The Pages artifact contains unexpected data files.');
}
for (const file of [...dataManifest.files, dataManifest.referenceIndex]) {
  const contents = await readFile(path.join(dataDirectory, file.path));
  if (
    contents.byteLength !== file.bytes ||
    createHash('sha256').update(contents).digest('hex') !== file.sha256
  ) {
    throw new Error('The Pages artifact contains a data hash mismatch.');
  }
}

console.log('GitHub Pages artifact structure is valid.');
