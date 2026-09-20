import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import { parseTCRSRecords } from '../src/features/tcrs/domain/parser';
import {
  deserializeReferenceData,
  type SerializedReferenceData,
} from '../src/features/tcrs/domain/referenceData';
import { assertTCRSRecordSet } from '../src/features/tcrs/domain/tcrsRecords';

const dataRoot = path.join(process.cwd(), 'public', 'data');
const serialized = JSON.parse(
  await readFile(path.join(dataRoot, 'reference-data.json'), 'utf8'),
) as SerializedReferenceData;
const references = deserializeReferenceData(serialized);
let total = 0;

for (const characterClass of CLASSES) {
  for (const moonSign of MOON_SIGNS) {
    const className = characterClass.id;
    const sign = moonSign.id;
    const filename = path.join(dataRoot, 'generated', `TCRS_${className}_${sign}.json`);
    const value: unknown = JSON.parse(await readFile(filename, 'utf8'));
    assertTCRSRecordSet(value, className, sign);
    const data = parseTCRSRecords(className, sign, value, references);
    if (data.allItems.length < 10_000) throw new Error(`Incomplete generated dataset: ${className}/${sign}.`);
    if (data.turnGeneration.food.length === 0 || data.turnGeneration.booze.length === 0) {
      throw new Error(`Missing consumable categories: ${className}/${sign}.`);
    }
    total += 1;
  }
}

if (total !== CLASSES.length * MOON_SIGNS.length)
  throw new Error('Generated combination inventory is incomplete.');
console.log(`Validated all ${total} generated browser datasets.`);
