export class RecentDatasetCache<T> {
  private readonly entries = new Map<string, T>();

  constructor(private readonly capacity = 2) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('Cache capacity must be a positive integer.');
    }
  }

  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value === undefined) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    while (this.entries.size > this.capacity) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
  }
}
