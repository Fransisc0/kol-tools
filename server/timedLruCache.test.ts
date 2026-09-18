import { describe, expect, it } from 'vitest';
import { TimedLruCache } from './timedLruCache';

describe('TimedLruCache', () => {
  it('evicts the least recently used entry at its size limit', () => {
    const cache = new TimedLruCache<number>(2, 1_000);
    cache.set('first', 1, 0);
    cache.set('second', 2, 0);
    expect(cache.get('first', 1)).toBe(1);
    cache.set('third', 3, 1);

    expect(cache.get('second', 1)).toBeUndefined();
    expect(cache.get('first', 1)).toBe(1);
    expect(cache.get('third', 1)).toBe(3);
  });

  it('expires entries after the configured TTL', () => {
    const cache = new TimedLruCache<string>(2, 100);
    cache.set('key', 'value', 10);
    expect(cache.get('key', 109)).toBe('value');
    expect(cache.get('key', 110)).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});
