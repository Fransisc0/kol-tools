import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lstat, mkdtemp, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export const KOLMAFIA_INPUTS = [
  'src/data/tcrs.txt',
  'src/data/items.txt',
  'src/data/modifiers.txt',
  'src/data/npcstores.txt',
  'src/data/coinmasters.txt',
  'src/data/concoctions.txt',
  'src/data/combats.txt',
  'src/data/monsters.txt',
  'src/data/cafe_food.txt',
  'src/data/cafe_booze.txt',
  'src/data/fullness.txt',
  'src/data/inebriety.txt',
  'src/net/sourceforge/kolmafia/persistence/TCRSDatabase.java',
  'src/net/sourceforge/kolmafia/objectpool/ItemPool.java',
  'src/net/sourceforge/kolmafia/objectpool/EffectPool.java',
  'src/net/sourceforge/kolmafia/modifiers/DoubleModifier.java',
  'src/net/sourceforge/kolmafia/modifiers/BooleanModifier.java',
  'src/net/sourceforge/kolmafia/modifiers/StringModifier.java',
  'src/net/sourceforge/kolmafia/utilities/PHPMTRandom.java',
  'src/net/sourceforge/kolmafia/utilities/PHPRandom.java',
  'src/net/sourceforge/kolmafia/utilities/PHPRandomSelection.java',
] as const;

const REVIEWED_ALGORITHM_HASHES: Readonly<Record<string, string>> = {
  'src/net/sourceforge/kolmafia/persistence/TCRSDatabase.java':
    '1f64b0c7cdbc332bfe05639bda1fc37c0f176fc52d83541733b78a8e64d9d0cb',
  'src/net/sourceforge/kolmafia/utilities/PHPMTRandom.java':
    '85d4384c679f75b23190b95ddf76eeb123ac58597b2bfa10da9d09bcd8bd4816',
  'src/net/sourceforge/kolmafia/utilities/PHPRandom.java':
    '4bcd30f5c9c26e012e4c58f5c26e05da61579429e1d891fc9f1842f7b1dff36d',
  'src/net/sourceforge/kolmafia/utilities/PHPRandomSelection.java':
    '9ff6794203f3d37ad7f292578a87ee58a379e6297288c42de5034d6fe95b8347',
};

const DOL_URL = 'https://data.loathers.net/dol.sqlite';
const MAX_DOL_BYTES = 16 * 1024 * 1024;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 32 * 1024 * 1024;

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sourceFingerprint(files: readonly { path: string; sha256: string }[]): string {
  const lines = [...files]
    .sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
    .map(({ path: name, sha256: hash }) => `${name}\0${hash}\n`)
    .join('');
  return sha256(new TextEncoder().encode(lines));
}

async function readBounded(response: Response, maximumBytes: number): Promise<Uint8Array> {
  if (!response.ok || !response.body) throw new Error('Upstream data could not be loaded.');
  const declared = Number(response.headers.get('content-length'));
  if (declared > maximumBytes) throw new Error('Upstream data exceeds its size limit.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > maximumBytes) throw new Error('Upstream data exceeds its size limit.');
    chunks.push(chunk);
  }
  if (size === 0) throw new Error('Upstream data is empty.');
  return Buffer.concat(chunks);
}

async function fetchBounded(url: string, maximumBytes: number): Promise<{ bytes: Uint8Array; etag: string | null }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  return { bytes: await readBounded(response, maximumBytes), etag: response.headers.get('etag') };
}

function decodeSource(bytes: Uint8Array): string {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (text.includes('\0')) throw new Error('Upstream source contains a NUL byte.');
  return text;
}

export function canonicalizeSource(bytes: Uint8Array): Uint8Array {
  // Review the same source on LF and CRLF checkouts without accepting changed text.
  return new TextEncoder().encode(decodeSource(bytes).replaceAll('\r\n', '\n'));
}

export interface CurrentSources {
  readonly kolmafiaRoot: string;
  readonly dolDatabase: string;
  readonly kolmafiaRevision: string;
  readonly kolmafiaCommittedAt: string;
  readonly dolEtag: string | null;
  readonly files: readonly { path: string; bytes: number; sha256: string }[];
  readonly algorithmVersion: string;
}

export interface SourceOptions {
  kolmafiaRoot?: string;
  dolDatabase?: string;
  dolEtag?: string;
}

export async function downloadDataOfLoathing(databaseFile: string, etagFile: string): Promise<void> {
  const downloaded = await fetchBounded(DOL_URL, MAX_DOL_BYTES);
  await mkdir(path.dirname(databaseFile), { recursive: true });
  await writeFile(databaseFile, downloaded.bytes);
  await writeFile(etagFile, downloaded.etag ?? '');
}

/** Resolve one immutable KoLmafia commit, then download only approved inputs. */
export async function acquireCurrentSources(options: SourceOptions = {}): Promise<CurrentSources> {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'kol-tools-sources-'));
  let kolmafiaRevision: string;
  let kolmafiaCommittedAt: string;
  if (options.kolmafiaRoot) {
    const [revision, committedAt] = await Promise.all([
      execFileAsync('git', ['-C', options.kolmafiaRoot, 'rev-parse', 'HEAD']),
      execFileAsync('git', ['-C', options.kolmafiaRoot, 'show', '-s', '--format=%cI', 'HEAD']),
    ]);
    kolmafiaRevision = revision.stdout.trim();
    kolmafiaCommittedAt = committedAt.stdout.trim();
  } else {
    const response = await fetch('https://api.github.com/repos/kolmafia/kolmafia/commits/main', {
      signal: AbortSignal.timeout(30_000),
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error('Could not resolve the current KoLmafia revision.');
    const commit = (await response.json()) as { sha?: unknown; commit?: { committer?: { date?: unknown } } };
    kolmafiaRevision = String(commit.sha ?? '');
    kolmafiaCommittedAt = String(commit.commit?.committer?.date ?? '');
  }
  if (!/^[0-9a-f]{40}$/.test(kolmafiaRevision) || !Number.isFinite(Date.parse(kolmafiaCommittedAt))) {
    throw new Error('KoLmafia revision metadata is invalid.');
  }

  const kolmafiaRoot = options.kolmafiaRoot ?? path.join(temporaryRoot, 'kolmafia');
  const resolvedRoot = options.kolmafiaRoot ? await realpath(kolmafiaRoot) : undefined;
  const files: Array<{ path: string; bytes: number; sha256: string }> = [];
  let totalSourceBytes = 0;
  for (const relative of KOLMAFIA_INPUTS) {
    const filename = path.join(kolmafiaRoot, ...relative.split('/'));
    let bytes: Uint8Array;
    if (options.kolmafiaRoot) {
      const resolvedFile = await realpath(filename);
      if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
        throw new Error('KoLmafia input resolves outside its source directory.');
      }
      if ((await lstat(filename)).isSymbolicLink()) throw new Error('KoLmafia input is a symlink.');
      bytes = await readFile(filename);
      if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error('KoLmafia input exceeds its size limit.');
    } else {
      const url = `https://raw.githubusercontent.com/kolmafia/kolmafia/${kolmafiaRevision}/${relative}`;
      bytes = (await fetchBounded(url, MAX_SOURCE_BYTES)).bytes;
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, bytes);
    }
    totalSourceBytes += bytes.byteLength;
    if (totalSourceBytes > MAX_TOTAL_SOURCE_BYTES) throw new Error('KoLmafia inputs exceed their size limit.');
    const canonical = canonicalizeSource(bytes);
    files.push({ path: relative, bytes: canonical.byteLength, sha256: sha256(canonical) });
  }
  for (const [relative, expected] of Object.entries(REVIEWED_ALGORITHM_HASHES)) {
    if (files.find((file) => file.path === relative)?.sha256 !== expected) {
      throw new Error(`KoLmafia TCRS algorithm changed: ${relative}. Review required before deployment.`);
    }
  }

  let dolDatabase: string;
  let dolEtag: string | null;
  if (options.dolDatabase) {
    dolDatabase = options.dolDatabase;
    if ((await lstat(dolDatabase)).isSymbolicLink()) throw new Error('Data of Loathing input is a symlink.');
    const bytes = await readFile(dolDatabase);
    if (bytes.byteLength > MAX_DOL_BYTES) throw new Error('Data of Loathing exceeds its size limit.');
    files.push({ path: 'data-of-loathing/dol.sqlite', bytes: bytes.byteLength, sha256: sha256(bytes) });
    dolEtag = options.dolEtag ?? null;
  } else {
    const downloaded = await fetchBounded(DOL_URL, MAX_DOL_BYTES);
    dolDatabase = path.join(temporaryRoot, 'dol.sqlite');
    dolEtag = downloaded.etag;
    await writeFile(dolDatabase, downloaded.bytes);
    files.push({ path: 'data-of-loathing/dol.sqlite', bytes: downloaded.bytes.byteLength, sha256: sha256(downloaded.bytes) });
  }
  return {
    kolmafiaRoot,
    dolDatabase,
    kolmafiaRevision,
    kolmafiaCommittedAt,
    dolEtag,
    files,
    algorithmVersion: sha256(new TextEncoder().encode(Object.values(REVIEWED_ALGORITHM_HASHES).join(':'))),
  };
}
