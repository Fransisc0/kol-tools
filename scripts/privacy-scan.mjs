import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage', 'scripts\\legacy']);
const ignoredFiles = new Set(['scripts\\privacy-scan.mjs']);
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
const forbiddenPatterns = [
  ['alicanf', '@', 'amc.edu'].join(''),
  ['Albany', ' Medical Center'].join(''),
  ['C:', '\\', 'Users', '\\', 'franc'].join(''),
  ['GEMINI', '_API_KEY'].join(''),
  ['MY_', 'GEMINI_API_KEY'].join(''),
];
const failures = [];

async function walk(directory, relativeDirectory = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const normalized = relativePath.replaceAll('/', '\\');
    if (entry.isDirectory()) {
      if (
        [...ignoredDirectories].some(
          (ignored) => normalized === ignored || normalized.startsWith(`${ignored}\\`),
        )
      )
        continue;
      await walk(path.join(directory, entry.name), relativePath);
      continue;
    }

    if (ignoredFiles.has(normalized)) continue;

    if (entry.name.endsWith('.log')) failures.push(`${relativePath}: log file must not be published`);
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
      failures.push(`${relativePath}: environment file must not be published`);
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    if ((await stat(path.join(directory, entry.name))).size > 15_000_000) continue;

    const content = await readFile(path.join(directory, entry.name), 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (content.toLowerCase().includes(pattern.toLowerCase()))
        failures.push(`${relativePath}: contains a private identifier`);
    }
  }
}

await walk(root);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Privacy scan passed: no configured personal identifiers, secrets, or logs found.');
}
