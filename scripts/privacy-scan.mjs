import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const root = process.cwd();
const ignoredDirectories = new Set([
  '.git',
  '.upstream',
  '.staged-data',
  'node_modules',
  'coverage',
  'scripts\\legacy',
]);
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
const execFileAsync = promisify(execFile);
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, 'private key'],
  [/\bgh[opsu]_[A-Za-z0-9_]{30,}\b/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/, 'GitHub fine-grained token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/(?:api[_-]?key|client[_-]?secret|password)\s*[:=]\s*["'][^"']{8,}["']/i, 'embedded credential'],
  [/[A-Z]:\\Users\\[^\\\s]+/i, 'Windows home path'],
  [/\/(?:Users|home)\/[^/\s]+/i, 'home-directory path'],
];

function inspectText(relativePath, content) {
  for (const pattern of forbiddenPatterns) {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      failures.push(`${relativePath}: contains a private identifier`);
    }
  }
  for (const [pattern, label] of secretPatterns) {
    if (pattern.test(content)) failures.push(`${relativePath}: contains a possible ${label}`);
  }
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const email of emails) {
    if (!email.toLowerCase().endsWith('@users.noreply.github.com')) {
      failures.push(`${relativePath}: contains a non-noreply email address`);
    }
  }
}

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
    if (entry.name.endsWith('.map') && normalized.startsWith('dist\\pages\\')) {
      failures.push(`${relativePath}: source map must not be published`);
    }
    if (entry.name.startsWith('.env')) {
      failures.push(`${relativePath}: environment file must not be published`);
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    if ((await stat(path.join(directory, entry.name))).size > 15_000_000) continue;

    const content = await readFile(path.join(directory, entry.name), 'utf8');
    inspectText(relativePath, content);
  }
}

await walk(root);

try {
  const { stdout } = await execFileAsync(
    'git',
    ['log', '-p', '--all', '--no-ext-diff', '--format=', '--', '.', ':(exclude)scripts/privacy-scan.mjs'],
    { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 },
  );
  for (const pattern of forbiddenPatterns) {
    if (stdout.toLowerCase().includes(pattern.toLowerCase())) {
      failures.push('git history: contains a configured private identifier');
    }
  }
} catch {
  failures.push('git history: could not be scanned');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Privacy scan passed: no configured personal identifiers, secrets, or logs found.');
}
