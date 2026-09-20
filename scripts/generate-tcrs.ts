import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import { createEffectPool } from '../src/features/tcrs/domain/derivationRolls';
import { deriveCafeRolls } from '../src/features/tcrs/domain/derivationRolls';
import { deriveItemRolls, type DerivationContext } from '../src/features/tcrs/domain/derivedItem';
import { parseRollTables } from '../src/features/tcrs/domain/rollTables';
import {
  assertTCRSRecordSet,
  type TCRSRecord,
  type TCRSRecordSet,
} from '../src/features/tcrs/domain/tcrsRecords';
import {
  acquireCurrentSources,
  sourceFingerprint,
  type CurrentSources,
  type SourceOptions,
} from './data/currentSources';
import { readDataOfLoathing } from './data/dataOfLoathing';
import { readDerivationRules } from './data/kolmafiaDerivationRules';
import { readEnchantmentNames } from './data/kolmafiaModifierRules';
import { enrichMissingWikiNames } from './data/kolmafiaWikiNames';

function sha256(contents: string): string {
  return createHash('sha256').update(contents).digest('hex');
}

function option(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  if (position < 0) return undefined;
  const value = process.argv[position + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

function formatQuality(quality: string): string {
  const normalized = quality.replaceAll('_', ' ');
  return normalized.includes('EPIC') ? normalized : normalized.toLowerCase();
}

interface CafeItem {
  id: number;
  name: string;
  averageAdventures: number;
}

function adventureAverages(text: string): ReadonlyMap<string, number> {
  const averages = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [name, , , , range] = line.split('\t');
    if (!name || !range) continue;
    const bounds = range.split('-').map(Number);
    if (bounds.every(Number.isFinite)) {
      averages.set(name, bounds.reduce((total, value) => total + value, 0) / bounds.length);
    }
  }
  return averages;
}

function readCafeItems(menuText: string, consumablesText: string): CafeItem[] {
  const averages = adventureAverages(consumablesText);
  const items: CafeItem[] = [];
  for (const line of menuText.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [rawId, name] = line.split('\t');
    if (rawId === '1' && !name) continue;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id >= 0 || !name) throw new Error('Invalid KoLmafia café menu.');
    const averageAdventures = averages.get(name);
    if (averageAdventures === undefined) throw new Error(`Missing café adventures for ${name}.`);
    items.push({ id, name, averageAdventures });
  }
  if (!items.length) throw new Error('The KoLmafia café menu is empty.');
  return items;
}

function deriveCafeRecords(
  items: readonly CafeItem[],
  isFood: boolean,
  className: string,
  moonSign: string,
  context: DerivationContext,
): TCRSRecord[] {
  return items.map(({ id, name, averageAdventures }) => {
    const result = deriveCafeRolls(id, name, isFood, averageAdventures, className, moonSign, context.tables);
    return [id, result.name, result.size, formatQuality(result.quality), ''];
  });
}

export interface GenerationResult {
  sources: CurrentSources;
  kolmafiaRoot: string;
  dolDatabase: string;
  dolEtag: string | null;
  manifest: {
    version: 1;
    generatedAt: string;
    dataFingerprint: string;
    dataOfLoathing: {
      url: string;
      etag: string | null;
      lastUpdate: number;
      lastRevision: number;
    };
    kolmafia: {
      repository: 'kolmafia/kolmafia';
      revision: string;
      committedAt: string;
      algorithmVersion: string;
    };
    sourceFiles: Array<{ path: string; bytes: number; sha256: string }>;
    outputs: Array<{ path: string; bytes: number; sha256: string }>;
  };
}

export async function generateTCRS(
  options: SourceOptions & { outputDirectory: string; writeManifest?: boolean; sources?: CurrentSources },
): Promise<GenerationResult> {
  const sources = options.sources ?? (await acquireCurrentSources(options));
  const dataRoot = path.join(sources.kolmafiaRoot, 'src', 'data');
  const codeRoot = path.join(sources.kolmafiaRoot, 'src', 'net', 'sourceforge', 'kolmafia');
  const readData = (name: string) => readFile(path.join(dataRoot, name), 'utf8');
  const readCode = (subdirectory: string, name: string) =>
    readFile(path.join(codeRoot, subdirectory, name), 'utf8');
  const [
    rollTableSource,
    modifierSource,
    foodMenu,
    boozeMenu,
    fullness,
    inebriety,
    derivationSource,
    itemPoolSource,
    effectPoolSource,
    doubleModifiers,
    booleanModifiers,
    stringModifiers,
  ] = await Promise.all([
    readData('tcrs.txt'),
    readData('modifiers.txt'),
    readData('cafe_food.txt'),
    readData('cafe_booze.txt'),
    readData('fullness.txt'),
    readData('inebriety.txt'),
    readCode('persistence', 'TCRSDatabase.java'),
    readCode('objectpool', 'ItemPool.java'),
    readCode('objectpool', 'EffectPool.java'),
    readCode('modifiers', 'DoubleModifier.java'),
    readCode('modifiers', 'BooleanModifier.java'),
    readCode('modifiers', 'StringModifier.java'),
  ]);

  const snapshot = readDataOfLoathing(sources.dolDatabase);
  const items = enrichMissingWikiNames(snapshot.items, modifierSource);
  const context: DerivationContext = {
    tables: parseRollTables(rollTableSource),
    effects: snapshot.effects,
    effectPool: createEffectPool(snapshot.effects),
    rules: readDerivationRules(derivationSource, itemPoolSource, effectPoolSource),
    enchantmentNames: readEnchantmentNames([doubleModifiers, booleanModifiers, stringModifiers]),
  };
  const cafeFood = readCafeItems(foodMenu, fullness);
  const cafeBooze = readCafeItems(boozeMenu, inebriety);
  const sortedItems = [...items.values()].sort((left, right) => left.id - right.id);

  const outputDirectory = path.resolve(options.outputDirectory);
  await mkdir(outputDirectory, { recursive: true });
  const outputs: Array<{ path: string; bytes: number; sha256: string }> = [];
  for (const characterClass of CLASSES) {
    for (const sign of MOON_SIGNS) {
      const className = characterClass.id;
      const moonSign = sign.id;
      const recordSet: TCRSRecordSet = {
        version: 1,
        className,
        moonSign,
        main: sortedItems.map((item) => {
          const result = deriveItemRolls(item, className, moonSign, context);
          return [item.id, result.name, result.size, result.quality, result.modifiers];
        }),
        cafeFood: deriveCafeRecords(cafeFood, true, className, moonSign, context),
        cafeBooze: deriveCafeRecords(cafeBooze, false, className, moonSign, context),
      };
      assertTCRSRecordSet(recordSet, className, moonSign);
      const filename = `TCRS_${className}_${moonSign}.json`;
      const contents = JSON.stringify(recordSet);
      await writeFile(path.join(outputDirectory, filename), contents);
      outputs.push({ path: filename, bytes: Buffer.byteLength(contents), sha256: sha256(contents) });
    }
  }
  const sourceFiles = [...sources.files].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  const dataFingerprint = sourceFingerprint(sourceFiles);
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    dataFingerprint,
    dataOfLoathing: {
      url: 'https://data.loathers.net/dol.sqlite',
      etag: sources.dolEtag,
      lastUpdate: snapshot.lastUpdate,
      lastRevision: snapshot.lastRevision,
    },
    kolmafia: {
      repository: 'kolmafia/kolmafia',
      revision: sources.kolmafiaRevision,
      committedAt: sources.kolmafiaCommittedAt,
      algorithmVersion: sources.algorithmVersion,
    },
    sourceFiles,
    outputs,
  } satisfies GenerationResult['manifest'];
  if (options.writeManifest !== false) {
    await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest));
  }
  console.log(`Generated ${outputs.length} deterministic TCRS datasets from validated current inputs.`);
  return {
    sources,
    kolmafiaRoot: sources.kolmafiaRoot,
    dolDatabase: sources.dolDatabase,
    dolEtag: sources.dolEtag,
    manifest,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const kolmafiaRoot = option('--kolmafia-root');
  const dolDatabase = option('--dol-database');
  const dolEtag = option('--dol-etag');
  const outputDirectory = option('--output') ?? path.join('public', 'data', 'generated');
  await generateTCRS({ kolmafiaRoot, dolDatabase, dolEtag, outputDirectory });
}
