import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearTCRSCaches, parseTCRSFile } from './tcrsParser';

describe('TCRS response caching', () => {
  const previousOffline = process.env.TCRS_OFFLINE;

  beforeAll(() => {
    process.env.TCRS_OFFLINE = 'true';
    clearTCRSCaches();
  });

  afterAll(() => {
    if (previousOffline === undefined) delete process.env.TCRS_OFFLINE;
    else process.env.TCRS_OFFLINE = previousOffline;
    clearTCRSCaches();
  });

  it('deduplicates concurrent requests for the same dataset', async () => {
    const [first, second] = await Promise.all([
      parseTCRSFile('Seal_Clubber', 'Mongoose'),
      parseTCRSFile('Seal_Clubber', 'Mongoose'),
    ]);

    expect(first).toBe(second);
    expect(first.allItems.length).toBeGreaterThan(0);
    expect(first.turnGeneration.booze.some((item) => item.quality.toLowerCase() !== 'epic')).toBe(true);
  }, 15_000);
});
