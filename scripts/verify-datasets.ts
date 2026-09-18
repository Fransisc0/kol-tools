import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import { parseTCRSData, type TCRSFileSet } from '../src/features/tcrs/domain/parser';
import {
  deserializeReferenceData,
  type SerializedReferenceData,
} from '../src/features/tcrs/domain/referenceData';

const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, 'public', 'data');
const goldenHashes = JSON.parse(
  await readFile(path.join(projectRoot, 'scripts', 'fixtures', 'tcrs-golden-hashes.json'), 'utf8'),
) as Record<string, string>;
const serializedReferences = JSON.parse(
  await readFile(path.join(dataDirectory, 'reference-data.json'), 'utf8'),
) as SerializedReferenceData;
const referenceData = deserializeReferenceData(serializedReferences);

async function readDataset(className: string, moonSign: string): Promise<TCRSFileSet> {
  const stem = path.join(dataDirectory, 'tcrs', `TCRS_${className}_${moonSign}`);
  const [main, cafeFood, cafeBooze] = await Promise.all([
    readFile(`${stem}.txt`, 'utf8'),
    readFile(`${stem}_cafe_food.txt`, 'utf8'),
    readFile(`${stem}_cafe_booze.txt`, 'utf8'),
  ]);
  return { main, cafeFood, cafeBooze };
}

let verified = 0;
for (const characterClass of CLASSES) {
  for (const moonSign of MOON_SIGNS) {
    const key = `${characterClass.id}_${moonSign.id}`;
    const data = parseTCRSData(
      characterClass.id,
      moonSign.id,
      await readDataset(characterClass.id, moonSign.id),
      referenceData,
    );
    if (data.allItems.length === 0) throw new Error(`No items parsed for ${key}.`);
    const actual = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    if (actual !== goldenHashes[key]) throw new Error(`Parser equivalence failed for ${key}.`);
    verified += 1;
  }
}

if (verified !== Object.keys(goldenHashes).length) {
  throw new Error('Golden-hash inventory does not match the supported dataset inventory.');
}
console.log(`Verified ${verified} browser datasets against release golden hashes.`);
