import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTCRSDataSourceCache, getTCRSFileContent, TCRS_UPSTREAM_BYTE_LIMIT } from './tcrsDataSource';

describe('TCRS data source', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearTCRSDataSourceCache();
  });

  it('rejects an oversized upstream response and uses the bundled fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('oversized', {
          headers: { 'content-length': String(TCRS_UPSTREAM_BYTE_LIMIT + 1) },
        }),
      ),
    );
    vi.spyOn(fs, 'readFileSync').mockReturnValue('bundled fallback content that is valid');

    await expect(getTCRSFileContent('TCRS_Seal_Clubber_Mongoose.txt')).resolves.toBe(
      'bundled fallback content that is valid',
    );
  });

  it('stops reading a streamed response after the byte limit', async () => {
    const oversizedBody = new Uint8Array(TCRS_UPSTREAM_BYTE_LIMIT + 1);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(oversizedBody)));
    vi.spyOn(fs, 'readFileSync').mockReturnValue('bounded bundled fallback');

    await expect(getTCRSFileContent('TCRS_Sauceror_Mongoose.txt')).resolves.toBe('bounded bundled fallback');
  });
});
