import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { prepareStaticData } from './build-static-data';

const outputDirectory = path.join(process.cwd(), 'public', 'data');

async function inventory(directory = outputDirectory): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await inventory(absolutePath));
    else {
      const relativePath = path.relative(outputDirectory, absolutePath).replaceAll('\\', '/');
      result[relativePath] = createHash('sha256')
        .update(await readFile(absolutePath))
        .digest('hex');
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

await prepareStaticData();
const first = await inventory();
await prepareStaticData();
const second = await inventory();
if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error('Static data generation is not deterministic.');
}
if (Object.keys(first).length !== 164) throw new Error('Static data inventory is incomplete.');
console.log('Static data generation is deterministic across consecutive clean builds.');
