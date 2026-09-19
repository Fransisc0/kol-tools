import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertValidSelection, loadDataManifest, loadTCRSFiles } from './staticData';

describe('static TCRS data loading', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects identifiers before constructing an asset URL', () => {
    expect(() => assertValidSelection('../private', 'Mongoose')).toThrow('Unsupported');
    expect(() => assertValidSelection('Seal_Clubber', '../private')).toThrow('Unsupported');
  });

  it('loads exactly the selected base and two café files', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(url));
    vi.stubGlobal('fetch', fetchMock);
    const files = await loadTCRSFiles('/kol-tools/tcrs/', 'Seal_Clubber', 'Mongoose');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(files.main).toContain('TCRS_Seal_Clubber_Mongoose.txt');
    expect(files.cafeFood).toContain('_cafe_food.txt');
    expect(files.cafeBooze).toContain('_cafe_booze.txt');
  });

  it('reports missing static files without exposing the requested URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(loadTCRSFiles('/', 'Seal_Clubber', 'Mongoose')).rejects.toThrow(
      'Required static data could not be loaded.',
    );
  });

  it('validates data-version metadata before exposing it to the interface', async () => {
    const manifest = {
      version: 2,
      source: {
        repository: 'kolmafia/kolmafia',
        revision: 'a'.repeat(40),
        committedAt: '2026-09-18T12:00:00.000Z',
      },
      dataFingerprint: 'b'.repeat(64),
      combinations: ['Seal_Clubber_Mongoose'],
      files: [{ path: 'tcrs/file.txt', bytes: 1, sha256: 'c'.repeat(64) }],
      referenceIndex: { path: 'reference-data.json', bytes: 1, sha256: 'd'.repeat(64) },
      sourceFiles: [{ path: 'data/TCRS/file.txt', bytes: 1, sha256: 'e'.repeat(64) }],
    };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(manifest)));
    await expect(loadDataManifest('/')).resolves.toEqual(manifest);

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...manifest, dataFingerprint: '../bad' })));
    await expect(loadDataManifest('/')).rejects.toThrow('manifest is invalid');
  });
});
