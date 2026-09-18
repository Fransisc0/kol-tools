export interface TimedCacheEntry<T> {
  value: T;
  createdAt: number;
}

/** A small bounded cache designed for large parsed TCRS payloads. */
export class TimedLruCache<T> {
  private readonly entries = new Map<string, TimedCacheEntry<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {
    if (maxEntries < 1) throw new Error('maxEntries must be at least 1');
    if (ttlMs < 1) throw new Error('ttlMs must be at least 1');
  }

  get(key: string, now = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (now - entry.createdAt >= this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, now = Date.now()): void {
    this.entries.delete(key);
    this.entries.set(key, { value, createdAt: now });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
