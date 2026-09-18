import { describe, expect, it } from 'vitest';
import { AsyncGate } from './asyncGate';

describe('AsyncGate', () => {
  it('runs no more than the configured number of jobs concurrently', async () => {
    const gate = new AsyncGate(2);
    let active = 0;
    let peak = 0;
    const run = (value: number) =>
      gate.run(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return value;
      });

    await expect(Promise.all([run(1), run(2), run(3), run(4)])).resolves.toEqual([1, 2, 3, 4]);
    expect(peak).toBe(2);
  });
});
