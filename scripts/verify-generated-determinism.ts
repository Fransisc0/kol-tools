import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { generateTCRS } from './generate-tcrs';

function option(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  if (position < 0) return undefined;
  const value = process.argv[position + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'kol-tools-determinism-'));
try {
  const etagFile = option('--dol-etag-file');
  const first = await generateTCRS({
    kolmafiaRoot: option('--kolmafia-root'),
    dolDatabase: option('--dol-database'),
    dolEtag: etagFile ? (await readFile(etagFile, 'utf8')).trim() || undefined : undefined,
    outputDirectory: path.join(temporaryRoot, 'first'),
    writeManifest: false,
  });
  const second = await generateTCRS({
    sources: first.sources,
    outputDirectory: path.join(temporaryRoot, 'second'),
    writeManifest: false,
  });
  if (
    first.manifest.dataFingerprint !== second.manifest.dataFingerprint ||
    JSON.stringify(first.manifest.outputs) !== JSON.stringify(second.manifest.outputs)
  ) {
    throw new Error('Two builds from the same inputs produced different TCRS datasets.');
  }
  console.log('Two builds produced byte-identical datasets.');
} finally {
  const resolved = await realpath(temporaryRoot);
  if (
    path.dirname(resolved) === (await realpath(os.tmpdir())) &&
    path.basename(resolved).startsWith('kol-tools-determinism-')
  ) {
    await rm(resolved, { recursive: true });
  }
}
