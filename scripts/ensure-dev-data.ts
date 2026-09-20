import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { isTCRSDataManifest } from '../src/features/tcrs/data/dataManifest';
import { prepareGeneratedStaticData } from './build-generated-static-data';

let prepared = false;
try {
  const filename = path.join('public', 'data', 'manifest.json');
  const manifest: unknown = JSON.parse(await readFile(filename, 'utf8'));
  prepared = isTCRSDataManifest(manifest) && manifest.version === 3;
} catch {
  // A clean clone has no generated data yet.
}

if (!prepared) await prepareGeneratedStaticData();
