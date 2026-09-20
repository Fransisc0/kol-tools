import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import type { ManifestFile, TCRSDataManifest } from '../src/features/tcrs/data/dataManifest';
import { loadReferenceData } from './data/referenceDataBuilder';
import { buildZoneIndex, sortedRecord } from './data/zoneIndex';
import { generateTCRS } from './generate-tcrs';

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, 'public', 'data');

function option(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  if (position < 0) return undefined;
  const value = process.argv[position + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

function metadata(publicPath: string, contents: string): ManifestFile {
  return {
    path: publicPath,
    bytes: Buffer.byteLength(contents),
    sha256: createHash('sha256').update(contents).digest('hex'),
  };
}

export async function prepareGeneratedStaticData(
  options: {
    kolmafiaRoot?: string;
    dolDatabase?: string;
    dolEtag?: string;
  } = {},
): Promise<void> {
  if (path.dirname(outputRoot) !== path.join(projectRoot, 'public')) {
    throw new Error('Unexpected generated-data directory.');
  }
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  const generated = await generateTCRS({
    ...options,
    outputDirectory: path.join(outputRoot, 'generated'),
    writeManifest: false,
  });
  const dataRoot = path.join(generated.kolmafiaRoot, 'src', 'data');
  const referenceData = loadReferenceData(dataRoot, projectRoot);
  const [combats, monsters, concoctions] = await Promise.all([
    readFile(path.join(dataRoot, 'combats.txt'), 'utf8'),
    readFile(path.join(dataRoot, 'monsters.txt'), 'utf8'),
    readFile(path.join(dataRoot, 'concoctions.txt'), 'utf8'),
  ]);
  const referenceContents = JSON.stringify({
    version: 1,
    items: [...referenceData.items.entries()].sort(([left], [right]) => left - right),
    effectModifiers: sortedRecord(referenceData.effectModifiers),
    npcStores: sortedRecord(referenceData.npcStores),
    craftMethods: sortedRecord(referenceData.craftMethods),
    thriftyWhitelist: [...referenceData.thriftyWhitelist].sort(),
    itemZones: buildZoneIndex(combats, monsters, concoctions),
  });
  const referenceIndex = metadata('reference-data.json', referenceContents);
  await writeFile(path.join(outputRoot, 'reference-data.json'), referenceContents);

  const manifest: TCRSDataManifest = {
    version: 3,
    source: {
      repository: 'kolmafia/kolmafia',
      revision: generated.manifest.kolmafia.revision,
      committedAt: generated.manifest.kolmafia.committedAt,
    },
    dataFingerprint: generated.manifest.dataFingerprint,
    combinations: CLASSES.flatMap((characterClass) =>
      MOON_SIGNS.map((moonSign) => `${characterClass.id}_${moonSign.id}`),
    ),
    files: generated.manifest.outputs.map((output) => ({
      ...output,
      path: `generated/${output.path}`,
    })),
    referenceIndex,
    sourceFiles: generated.manifest.sourceFiles,
    generatedAt: generated.manifest.generatedAt,
    dataOfLoathing: generated.manifest.dataOfLoathing,
    algorithmVersion: generated.manifest.kolmafia.algorithmVersion,
  };
  await writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest));
  console.log('Prepared generated TCRS data and current reference index.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const dolEtagFile = option('--dol-etag-file');
  await prepareGeneratedStaticData({
    kolmafiaRoot: option('--kolmafia-root'),
    dolDatabase: option('--dol-database'),
    dolEtag: dolEtagFile ? (await readFile(dolEtagFile, 'utf8')).trim() || undefined : option('--dol-etag'),
  });
}
