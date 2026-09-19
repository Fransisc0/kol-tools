import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { CLASSES, MOON_SIGNS } from '../../src/data/constants';

export const KOLMAFIA_REPOSITORY = 'kolmafia/kolmafia';
export const MAX_SOURCE_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_DATASET_BYTES = 64 * 1024 * 1024;

export const REFERENCE_FILENAMES = [
  'items.txt',
  'modifiers.txt',
  'npcstores.txt',
  'coinmasters.txt',
  'concoctions.txt',
  'combats.txt',
  'monsters.txt',
  'cafe_food.txt',
  'cafe_booze.txt',
] as const;

export const TCRS_FILENAMES = CLASSES.flatMap(({ id: classId }) =>
  MOON_SIGNS.flatMap(({ id: signId }) => {
    const stem = `TCRS_${classId}_${signId}`;
    return [`${stem}.txt`, `${stem}_cafe_food.txt`, `${stem}_cafe_booze.txt`];
  }),
);

export interface SourceFileMetadata {
  path: string;
  bytes: number;
  sha256: string;
}

export interface KolmafiaSourceMetadata {
  repository: typeof KOLMAFIA_REPOSITORY;
  revision: string | null;
  committedAt: string | null;
}

export interface ValidatedDataset {
  source: KolmafiaSourceMetadata;
  files: SourceFileMetadata[];
  fingerprint: string;
}

interface SyncDatasetOptions {
  upstreamRoot: string;
  destinationRoot: string;
  revision: string;
  committedAt: string;
}

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll('\\', '/');
}

function validateSourceIdentity(revision: string, committedAt: string): void {
  if (!/^[0-9a-f]{40}$/i.test(revision)) throw new Error('The KoLmafia revision must be a full commit SHA.');
  if (!Number.isFinite(Date.parse(committedAt))) throw new Error('The KoLmafia commit date is invalid.');
}

async function readValidatedFile(filename: string): Promise<Buffer> {
  const stats = await lstat(filename);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('KoLmafia data must be a regular file.');
  if (stats.size === 0 || stats.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error('A KoLmafia data file has an invalid size.');
  }

  const contents = await readFile(filename);
  const text = utf8Decoder.decode(contents);
  if (text.includes('\0')) throw new Error('A KoLmafia data file contains a NUL byte.');
  return contents;
}

function calculateFingerprint(files: readonly SourceFileMetadata[]): string {
  const canonical = files
    .map((file) => `${file.path}\0${file.bytes}\0${file.sha256}\n`)
    .sort()
    .join('');
  return sha256(canonical);
}

export async function syncKolmafiaDataset(options: SyncDatasetOptions): Promise<ValidatedDataset> {
  validateSourceIdentity(options.revision, options.committedAt);

  const upstreamTcrsDirectory = path.join(options.upstreamRoot, 'data', 'TCRS');
  const availableTcrsFiles = (await readdir(upstreamTcrsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
    .map((entry) => entry.name)
    .sort();
  const expectedTcrsFiles = [...TCRS_FILENAMES].sort();
  if (JSON.stringify(availableTcrsFiles) !== JSON.stringify(expectedTcrsFiles)) {
    throw new Error('The upstream TCRS file inventory does not match the supported combinations.');
  }

  await rm(options.destinationRoot, { recursive: true, force: true });
  await mkdir(path.join(options.destinationRoot, 'tcrs'), { recursive: true });

  const files: SourceFileMetadata[] = [];
  let totalBytes = 0;
  const copyValidated = async (source: string, destination: string, publicPath: string) => {
    const contents = await readValidatedFile(source);
    totalBytes += contents.byteLength;
    if (totalBytes > MAX_DATASET_BYTES) throw new Error('The approved KoLmafia dataset exceeds its size limit.');
    await writeFile(destination, contents);
    files.push({ path: normalizeRelativePath(publicPath), bytes: contents.byteLength, sha256: sha256(contents) });
  };

  for (const filename of REFERENCE_FILENAMES) {
    await copyValidated(
      path.join(options.upstreamRoot, 'src', 'data', filename),
      path.join(options.destinationRoot, filename),
      `src/data/${filename}`,
    );
  }
  for (const filename of TCRS_FILENAMES) {
    await copyValidated(
      path.join(upstreamTcrsDirectory, filename),
      path.join(options.destinationRoot, 'tcrs', filename),
      `data/TCRS/${filename}`,
    );
  }

  files.sort((left, right) => left.path.localeCompare(right.path));
  const source: KolmafiaSourceMetadata = {
    repository: KOLMAFIA_REPOSITORY,
    revision: options.revision.toLowerCase(),
    committedAt: new Date(options.committedAt).toISOString(),
  };
  await writeFile(
    path.join(options.destinationRoot, 'source.json'),
    `${JSON.stringify({ source, files, fingerprint: calculateFingerprint(files) }, null, 2)}\n`,
  );
  return { source, files, fingerprint: calculateFingerprint(files) };
}

export async function describeLocalDataset(dataRoot: string): Promise<ValidatedDataset> {
  const files: SourceFileMetadata[] = [];
  let totalBytes = 0;
  for (const filename of REFERENCE_FILENAMES) {
    const contents = await readValidatedFile(path.join(dataRoot, filename));
    totalBytes += contents.byteLength;
    files.push({ path: `src/data/${filename}`, bytes: contents.byteLength, sha256: sha256(contents) });
  }
  for (const filename of TCRS_FILENAMES) {
    const contents = await readValidatedFile(path.join(dataRoot, 'tcrs', filename));
    totalBytes += contents.byteLength;
    files.push({ path: `data/TCRS/${filename}`, bytes: contents.byteLength, sha256: sha256(contents) });
  }
  if (totalBytes > MAX_DATASET_BYTES) throw new Error('The approved KoLmafia dataset exceeds its size limit.');

  let source: KolmafiaSourceMetadata = {
    repository: KOLMAFIA_REPOSITORY,
    revision: null,
    committedAt: null,
  };
  try {
    const metadata = JSON.parse(await readFile(path.join(dataRoot, 'source.json'), 'utf8')) as {
      source?: Partial<KolmafiaSourceMetadata>;
    };
    if (
      metadata.source?.repository === KOLMAFIA_REPOSITORY &&
      typeof metadata.source.revision === 'string' &&
      /^[0-9a-f]{40}$/i.test(metadata.source.revision) &&
      typeof metadata.source.committedAt === 'string' &&
      Number.isFinite(Date.parse(metadata.source.committedAt))
    ) {
      source = {
        repository: KOLMAFIA_REPOSITORY,
        revision: metadata.source.revision.toLowerCase(),
        committedAt: new Date(metadata.source.committedAt).toISOString(),
      };
    }
  } catch {
    // A checked-in snapshot without source metadata remains a supported local fallback.
  }

  files.sort((left, right) => left.path.localeCompare(right.path));
  return { source, files, fingerprint: calculateFingerprint(files) };
}
