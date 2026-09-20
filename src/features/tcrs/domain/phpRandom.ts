/** The two independent PHP 5-era streams KoLmafia uses when deriving TCRS rolls. */

const INT_MAX_PLUS_ONE = 0x80000000;

export class PHPMTRandom {
  private readonly state: number[] = [];
  private index = 624;

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new Error('Invalid TCRS seed.');
    this.state.push(seed >>> 0);
    for (let index = 1; index < 624; index += 1) {
      const previous = this.state[index - 1];
      this.state.push((Math.imul(1812433253, previous ^ (previous >>> 30)) + index) >>> 0);
    }
    this.reload();
  }

  private reload(): void {
    const shift = this.index - 624;
    for (let index = shift; index < shift + 624; index += 1) {
      const first = this.state[index];
      const second = this.state[index + 1];
      const mixed = (first & 0x80000000) | (second & 0x7fffffff);
      const twisted = this.state[index + 397] ^ (mixed >>> 1) ^ (first & 1 ? 0x9908b0df : 0);
      this.state.push(twisted >>> 0);
    }
  }

  next(): number {
    if (this.index >= this.state.length) this.reload();
    let value = this.state[this.index++];
    value ^= value >>> 11;
    value ^= (value << 7) & 0x9d2c5680;
    value ^= (value << 15) & 0xefc60000;
    value ^= value >>> 18;
    return (value >>> 0) >>> 1;
  }

  nextDouble(): number {
    return this.next() / INT_MAX_PLUS_ONE;
  }

  nextInt(min: number, max?: number): number {
    const lower = max === undefined ? 0 : min;
    const upper = max === undefined ? min : max;
    return lower + Math.trunc((upper - lower + 1) * this.nextDouble());
  }

  pickOne<T>(values: readonly T[]): T | undefined {
    return values.length ? values[this.nextInt(0, values.length - 1)] : undefined;
  }
}

export class PHPRandom {
  private readonly state: number[] = [];

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new Error('Invalid TCRS seed.');
    this.state.push(seed | 0);
    for (let index = 1; index < 31; index += 1) {
      let value = (16807 * this.state[index - 1]) % 2147483647;
      if (value < 0) value += 2147483647;
      this.state.push(value);
    }
    for (let index = 31; index < 34; index += 1) this.state.push(this.state[index - 31]);
    for (let index = 34; index < 344; index += 1) this.next();
  }

  next(): number {
    const index = this.state.length;
    const value = (this.state[index - 31] + this.state[index - 3]) | 0;
    this.state.push(value);
    return value >>> 1;
  }

  nextDouble(): number {
    return this.next() / INT_MAX_PLUS_ONE;
  }

  nextInt(min: number, max?: number): number {
    const lower = max === undefined ? 0 : min;
    const upper = max === undefined ? min : max;
    return lower + Math.trunc((upper - lower + 1) * this.nextDouble());
  }

  array(size: number, requested: number): number[] {
    const count = Math.min(requested, size);
    const result: number[] = [];
    for (let index = 0; index < size && result.length < count; index += 1) {
      if (this.nextDouble() < (count - result.length) / (size - index)) result.push(index);
    }
    return result;
  }

  shuffle<T>(values: T[]): void {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const selected = this.nextInt(0, index);
      [values[index], values[selected]] = [values[selected], values[index]];
    }
  }
}

export class PHPRandomSelection {
  constructor(
    private readonly random: PHPRandom,
    private readonly mtRandom: PHPMTRandom,
  ) {}

  pick(size: number, count: number): number[] {
    if (size <= 0 || count <= 0) return [];
    if (count !== 1) return this.random.array(size, count);
    let selected = size;
    while (selected === size) selected = this.mtRandom.nextInt(0, size);
    return [selected];
  }
}
