import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertValidSelection, loadTCRSFiles } from './staticData';

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
});
