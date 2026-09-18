import { describe, expect, it } from 'vitest';

import { RecentDatasetCache } from './recentDatasetCache';

describe('recent dataset cache', () => {
  it('retains only the two most recently used datasets', () => {
    const cache = new RecentDatasetCache<number>(2);
    cache.set('first', 1);
    cache.set('second', 2);
    expect(cache.get('first')).toBe(1);
    cache.set('third', 3);
    expect(cache.get('second')).toBeUndefined();
    expect(cache.get('first')).toBe(1);
    expect(cache.get('third')).toBe(3);
  });
});
