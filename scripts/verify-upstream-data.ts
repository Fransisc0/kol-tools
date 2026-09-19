import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import { isTCRSDataManifest } from '../src/features/tcrs/data/dataManifest';
import { parseTCRSData, type TCRSFileSet } from '../src/features/tcrs/domain/parser';
import {
  deserializeReferenceData,
  type SerializedReferenceData,
} from '../src/features/tcrs/domain/referenceData';
import type { TCRSItem } from '../src/types';
import { prepareStaticData } from './build-static-data';

function readSourceArgument(): string {
  const index = process.argv.indexOf('--source');
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error('The --source option requires a dataset directory.');
  return path.resolve(value);
}

const outputRoot = path.join(process.cwd(), 'public', 'data');

async function inventory(directory = outputRoot): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await inventory(filename));
    else {
      const key = path.relative(outputRoot, filename).replaceAll('\\', '/');
      result[key] = createHash('sha256')
        .update(await readFile(filename))
        .digest('hex');
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

async function readDataset(className: string, moonSign: string): Promise<TCRSFileSet> {
  const stem = path.join(outputRoot, 'tcrs', `TCRS_${className}_${moonSign}`);
  const [main, cafeFood, cafeBooze] = await Promise.all([
    readFile(`${stem}.txt`, 'utf8'),
    readFile(`${stem}_cafe_food.txt`, 'utf8'),
    readFile(`${stem}_cafe_booze.txt`, 'utf8'),
  ]);
  return { main, cafeFood, cafeBooze };
}

function validateItem(item: TCRSItem, key: string): void {
  // KoLmafia assigns stable negative IDs to café-only items; zero is never a valid item identity.
  if (!Number.isSafeInteger(item.id) || item.id === 0) throw new Error(`Invalid item ID in ${key}.`);
  if (!item.origName.trim()) throw new Error(`Missing original item name in ${key}.`);
  if (!Number.isFinite(item.extractedNumericBonus)) throw new Error(`Invalid item bonus in ${key}.`);
  if (item.origName.includes('\0') || item.tcrsName.includes('\0'))
    throw new Error(`Invalid item text in ${key}.`);
}

const dataRoot = readSourceArgument();
await prepareStaticData({ dataRoot });
const firstBuild = await inventory();
await prepareStaticData({ dataRoot });
const secondBuild = await inventory();
if (JSON.stringify(firstBuild) !== JSON.stringify(secondBuild)) {
  throw new Error('Upstream static-data generation is not deterministic.');
}

const manifestValue: unknown = JSON.parse(await readFile(path.join(outputRoot, 'manifest.json'), 'utf8'));
if (!isTCRSDataManifest(manifestValue)) throw new Error('The generated upstream manifest is invalid.');
if (!manifestValue.source.revision || !manifestValue.source.committedAt) {
  throw new Error('The staged upstream dataset is missing its source identity.');
}
if (manifestValue.files.length !== 162 || manifestValue.sourceFiles.length !== 171) {
  throw new Error('The staged upstream dataset inventory is incomplete.');
}

const serializedReferences = JSON.parse(
  await readFile(path.join(outputRoot, 'reference-data.json'), 'utf8'),
) as SerializedReferenceData;
const referenceData = deserializeReferenceData(serializedReferences);

let verified = 0;
for (const characterClass of CLASSES) {
  for (const moonSign of MOON_SIGNS) {
    const key = `${characterClass.id}_${moonSign.id}`;
    const response = parseTCRSData(
      characterClass.id,
      moonSign.id,
      await readDataset(characterClass.id, moonSign.id),
      referenceData,
    );
    if (response.className !== characterClass.id || response.moonSign !== moonSign.id) {
      throw new Error(`Dataset identity mismatch for ${key}.`);
    }
    if (response.allItems.length === 0) throw new Error(`No items parsed for ${key}.`);
    const ids = new Set<number>();
    for (const item of response.allItems) {
      validateItem(item, key);
      if (ids.has(item.id)) throw new Error(`Duplicate item ID in ${key}.`);
      ids.add(item.id);
    }
    for (const value of Object.values(response.summary)) {
      if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid summary count in ${key}.`);
    }
    verified += 1;
  }
}

if (verified !== CLASSES.length * MOON_SIGNS.length) {
  throw new Error('Not every supported class/sign combination was validated.');
}
console.log(
  `Validated ${verified} upstream datasets from ${manifestValue.source.revision.slice(0, 12)} (${manifestValue.dataFingerprint.slice(0, 12)}).`,
);
