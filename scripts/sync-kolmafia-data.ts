import path from 'node:path';

import { syncKolmafiaDataset } from './data/kolmafiaDataset';

function readArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`Missing required argument: ${name}`);
  return value;
}

const result = await syncKolmafiaDataset({
  upstreamRoot: path.resolve(readArgument('--source')),
  destinationRoot: path.resolve(readArgument('--destination')),
  revision: readArgument('--revision'),
  committedAt: readArgument('--committed-at'),
});

console.log(
  `Validated ${result.files.length} KoLmafia files at ${result.source.revision?.slice(0, 12)} (${result.fingerprint.slice(0, 12)}).`,
);
