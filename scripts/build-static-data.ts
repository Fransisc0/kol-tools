import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import { loadReferenceData } from './data/referenceDataBuilder';

const root = process.cwd();
const outputDirectory = path.join(root, 'public', 'data');
const sourceDirectory = path.join(root, 'data', 'kolmafia', 'tcrs');

function recordFromMap<T>(map: ReadonlyMap<string, T>): Record<string, T> {
  return Object.fromEntries(
    [...map.entries()].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );
}

function buildZoneIndex(combatsRaw: string, monstersRaw: string, concoctionsRaw: string) {
  const monsterZones = new Map<string, string[]>();
  const itemZones = new Map<string, string[]>();

  for (const line of combatsRaw.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    for (const value of parts.slice(2)) {
      const monster = value.replace(/:.*/, '').trim();
      const zones = monsterZones.get(monster) ?? [];
      if (!zones.includes(parts[0])) zones.push(parts[0]);
      monsterZones.set(monster, zones);
    }
  }

  for (const line of monstersRaw.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    const zones = monsterZones.get(parts[0]);
    if (parts.length < 4 || !zones) continue;
    for (const value of parts.slice(4)) {
      let item = value.replace(/\(.*\)/, '').trim();
      item = item
        .replace(/^[pncf]+\s+/, '')
        .trim()
        .toLowerCase();
      const existing = itemZones.get(item) ?? [];
      for (const zone of zones) if (!existing.includes(zone)) existing.push(zone);
      itemZones.set(item, existing);
    }
  }

  for (let iteration = 0, changed = true; changed && iteration < 10; iteration += 1) {
    changed = false;
    for (const line of concoctionsRaw.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const parts = line.split('\t').map((value) => value.trim());
      if (parts.length < 3 || !parts[1].toUpperCase().includes('SMITH')) continue;
      const craftedItem = parts[0].toLowerCase();
      const existing = itemZones.get(craftedItem) ?? [];
      for (const ingredient of parts.slice(2).map((value) => value.toLowerCase())) {
        for (const zone of itemZones.get(ingredient) ?? []) {
          if (!existing.includes(zone)) {
            existing.push(zone);
            changed = true;
          }
        }
      }
      if (existing.length) itemZones.set(craftedItem, existing);
    }
  }

  return recordFromMap(itemZones);
}

export async function prepareStaticData(): Promise<void> {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, 'tcrs'), { recursive: true });

  const referenceData = loadReferenceData(root);
  const [combatsRaw, monstersRaw, concoctionsRaw] = await Promise.all([
    readFile(path.join(root, 'data/kolmafia/combats.txt'), 'utf8'),
    readFile(path.join(root, 'data/kolmafia/monsters.txt'), 'utf8'),
    readFile(path.join(root, 'data/kolmafia/concoctions.txt'), 'utf8'),
  ]);

  const combinations: string[] = [];
  const publicFiles: string[] = [];
  for (const characterClass of CLASSES) {
    for (const moonSign of MOON_SIGNS) {
      const stem = `TCRS_${characterClass.id}_${moonSign.id}`;
      combinations.push(`${characterClass.id}_${moonSign.id}`);
      for (const suffix of ['', '_cafe_food', '_cafe_booze']) {
        const filename = `${stem}${suffix}.txt`;
        await cp(path.join(sourceDirectory, filename), path.join(outputDirectory, 'tcrs', filename));
        publicFiles.push(`tcrs/${filename}`);
      }
    }
  }

  const serialized = {
    version: 1,
    items: [...referenceData.items.entries()].sort(([left], [right]) => left - right),
    effectModifiers: recordFromMap(referenceData.effectModifiers),
    npcStores: recordFromMap(referenceData.npcStores),
    craftMethods: recordFromMap(referenceData.craftMethods),
    thriftyWhitelist: [...referenceData.thriftyWhitelist].sort(),
    itemZones: buildZoneIndex(combatsRaw, monstersRaw, concoctionsRaw),
  };

  await writeFile(path.join(outputDirectory, 'reference-data.json'), JSON.stringify(serialized));
  await writeFile(
    path.join(outputDirectory, 'manifest.json'),
    JSON.stringify({ version: 1, combinations, files: publicFiles }),
  );

  console.log(`Prepared ${combinations.length} class/sign combinations for static hosting.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prepareStaticData();
}
