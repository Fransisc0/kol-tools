import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertValidSelection, loadDataManifest, loadTCRSRecords } from './staticData';

describe('static TCRS data loading', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects identifiers before constructing an asset URL', () => {
    expect(() => assertValidSelection('../private', 'Mongoose')).toThrow('Unsupported');
    expect(() => assertValidSelection('Seal_Clubber', '../private')).toThrow('Unsupported');
  });

  it('reports missing static files without exposing the requested URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(loadTCRSRecords('/', 'Seal_Clubber', 'Mongoose')).rejects.toThrow(
      'Required static data could not be loaded.',
    );
  });

  it('loads only the selected generated JSON and validates its class and sign', async () => {
    const dataset = {
      version: 1,
      className: 'Seal_Clubber',
      moonSign: 'Mongoose',
      main: Array.from({ length: 1000 }, (_, index) => [index + 1, `item ${index}`, 0, '', '']),
      cafeFood: [],
      cafeBooze: [],
    };
    const fetchMock = vi.fn(async () => Response.json(dataset));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadTCRSRecords('/kol-tools/tcrs/', 'Seal_Clubber', 'Mongoose')).resolves.toEqual(dataset);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/kol-tools/tcrs/data/generated/TCRS_Seal_Clubber_Mongoose.json',
      expect.any(Object),
    );
    await expect(loadTCRSRecords('/', 'Seal_Clubber', 'Wallaby')).rejects.toThrow('Invalid TCRS dataset.');
  });

  it('validates data-version metadata before exposing it to the interface', async () => {
    const manifest = {
      version: 3,
      source: {
        repository: 'kolmafia/kolmafia',
        revision: 'a'.repeat(40),
        committedAt: '2026-09-18T12:00:00.000Z',
      },
      dataFingerprint: 'b'.repeat(64),
      combinations: ['Seal_Clubber_Mongoose'],
      files: [{ path: 'generated/TCRS_Seal_Clubber_Mongoose.json', bytes: 1, sha256: 'c'.repeat(64) }],
      referenceIndex: { path: 'reference-data.json', bytes: 1, sha256: 'd'.repeat(64) },
      sourceFiles: [{ path: 'data-of-loathing/dol.sqlite', bytes: 1, sha256: 'e'.repeat(64) }],
      generatedAt: '2026-09-18T12:00:00.000Z',
      dataOfLoathing: { url: 'https://data.loathers.net/dol.sqlite', etag: null, lastUpdate: 1, lastRevision: 1 },
      algorithmVersion: 'f'.repeat(64),
    };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(manifest)));
    await expect(loadDataManifest('/')).resolves.toEqual(manifest);

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...manifest, dataFingerprint: '../bad' })));
    await expect(loadDataManifest('/')).rejects.toThrow('manifest is invalid');
  });
});
