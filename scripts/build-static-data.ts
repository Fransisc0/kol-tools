import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import type { ManifestFile, TCRSDataManifest } from '../src/features/tcrs/data/dataManifest';
import { describeLocalDataset } from './data/kolmafiaDataset';
import { loadReferenceData } from './data/referenceDataBuilder';

const root = process.cwd();
const outputDirectory = path.join(root, 'public', 'data');
const defaultDataRoot = path.join(root, 'data', 'kolmafia');

interface PrepareStaticDataOptions {
  dataRoot?: string;
}

async function fileMetadata(filename: string, publicPath: string): Promise<ManifestFile> {
  const [contents, fileStats] = await Promise.all([readFile(filename), stat(filename)]);
  return {
    path: publicPath.replaceAll('\\', '/'),
    bytes: fileStats.size,
    sha256: createHash('sha256').update(contents).digest('hex'),
  };
}

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

export async function prepareStaticData(options: PrepareStaticDataOptions = {}): Promise<void> {
  const dataRoot = path.resolve(options.dataRoot ?? defaultDataRoot);
  const sourceDirectory = path.join(dataRoot, 'tcrs');
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, 'tcrs'), { recursive: true });

  const sourceDataset = await describeLocalDataset(dataRoot);
  const referenceData = loadReferenceData(dataRoot, root);
  const [combatsRaw, monstersRaw, concoctionsRaw] = await Promise.all([
    readFile(path.join(dataRoot, 'combats.txt'), 'utf8'),
    readFile(path.join(dataRoot, 'monsters.txt'), 'utf8'),
    readFile(path.join(dataRoot, 'concoctions.txt'), 'utf8'),
  ]);

  const combinations: string[] = [];
  const publicFiles: ManifestFile[] = [];
  for (const characterClass of CLASSES) {
    for (const moonSign of MOON_SIGNS) {
      const stem = `TCRS_${characterClass.id}_${moonSign.id}`;
      combinations.push(`${characterClass.id}_${moonSign.id}`);
      for (const suffix of ['', '_cafe_food', '_cafe_booze']) {
        const filename = `${stem}${suffix}.txt`;
        const destination = path.join(outputDirectory, 'tcrs', filename);
        await cp(path.join(sourceDirectory, filename), destination);
        publicFiles.push(await fileMetadata(destination, `tcrs/${filename}`));
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

  const referenceFilename = path.join(outputDirectory, 'reference-data.json');
  await writeFile(referenceFilename, JSON.stringify(serialized));
  const manifest: TCRSDataManifest = {
    version: 2,
    source: sourceDataset.source,
    dataFingerprint: sourceDataset.fingerprint,
    combinations,
    files: publicFiles,
    referenceIndex: await fileMetadata(referenceFilename, 'reference-data.json'),
    sourceFiles: sourceDataset.files,
  };
  await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest));

  console.log(`Prepared ${combinations.length} class/sign combinations for static hosting.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const sourceIndex = process.argv.indexOf('--source');
  const dataRoot = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : undefined;
  if (sourceIndex >= 0 && (!dataRoot || dataRoot.startsWith('--'))) {
    throw new Error('The --source option requires a dataset directory.');
  }
  await prepareStaticData({ dataRoot });
}
