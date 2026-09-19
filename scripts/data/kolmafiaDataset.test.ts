import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  KOLMAFIA_REPOSITORY,
  MAX_SOURCE_FILE_BYTES,
  REFERENCE_FILENAMES,
  syncKolmafiaDataset,
  TCRS_FILENAMES,
} from './kolmafiaDataset';

const revision = 'a'.repeat(40);
const committedAt = '2026-09-18T12:00:00Z';
let fixtureRoot = '';
let sourceRoot = '';
let destinationRoot = '';

async function createValidSource(): Promise<void> {
  await mkdir(path.join(sourceRoot, 'src', 'data'), { recursive: true });
  await mkdir(path.join(sourceRoot, 'data', 'TCRS'), { recursive: true });
  await Promise.all([
    ...REFERENCE_FILENAMES.map((filename) =>
      writeFile(path.join(sourceRoot, 'src', 'data', filename), 'fixture\n'),
    ),
    ...TCRS_FILENAMES.map((filename) =>
      writeFile(path.join(sourceRoot, 'data', 'TCRS', filename), '1\titem\t0\t\t\n'),
    ),
  ]);
}

beforeEach(async () => {
  fixtureRoot = await mkdtemp(path.join(tmpdir(), 'kol-tools-data-'));
  sourceRoot = path.join(fixtureRoot, 'source');
  destinationRoot = path.join(fixtureRoot, 'destination');
  await createValidSource();
});

afterEach(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
});

describe('KoLmafia dataset synchronization', () => {
  it('copies only the complete allowlist and records deterministic source metadata', async () => {
    const result = await syncKolmafiaDataset({
      upstreamRoot: sourceRoot,
      destinationRoot,
      revision,
      committedAt,
    });
    expect(result.source).toEqual({
      repository: KOLMAFIA_REPOSITORY,
      revision,
      committedAt: '2026-09-18T12:00:00.000Z',
    });
    expect(result.files).toHaveLength(171);
    expect(result.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(await readFile(path.join(destinationRoot, 'tcrs', TCRS_FILENAMES[0]), 'utf8')).toContain('item');
  });

  it('rejects missing or unexpected TCRS files', async () => {
    await rm(path.join(sourceRoot, 'data', 'TCRS', TCRS_FILENAMES[0]));
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow('inventory');

    await createValidSource();
    await writeFile(path.join(sourceRoot, 'data', 'TCRS', 'unexpected.txt'), 'fixture\n');
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow('inventory');
  });

  it('rejects oversized, malformed UTF-8, and NUL-containing source files', async () => {
    const filename = path.join(sourceRoot, 'src', 'data', REFERENCE_FILENAMES[0]);
    await writeFile(filename, Buffer.alloc(MAX_SOURCE_FILE_BYTES + 1, 65));
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow('size');

    await writeFile(filename, Buffer.from([0xc3, 0x28]));
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow();

    await writeFile(filename, Buffer.from('fixture\0value'));
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow('NUL');
  });

  it.skipIf(process.platform === 'win32')('rejects symlinked source files', async () => {
    const filename = path.join(sourceRoot, 'src', 'data', REFERENCE_FILENAMES[0]);
    const target = path.join(sourceRoot, 'target.txt');
    await writeFile(target, 'fixture\n');
    await rm(filename);
    await symlink(target, filename);
    await expect(
      syncKolmafiaDataset({ upstreamRoot: sourceRoot, destinationRoot, revision, committedAt }),
    ).rejects.toThrow('regular file');
  });
});
