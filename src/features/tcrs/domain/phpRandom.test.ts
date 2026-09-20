import { describe, expect, it } from 'vitest';

import { PHPMTRandom, PHPRandom, PHPRandomSelection } from './phpRandom';

// Vectors are from KoLmafia's PHPMTRandomTest and PHPRandomTest, which cite PHP 5.3.
describe('KoLmafia-compatible PHP random streams', () => {
  it.each([
    [1, [1244335972, 15217923, 1546885062, 2002651684]],
    [2147483647, [844801015, 1915574197, 726043576, 780612688]],
    [-8008135, [595078597, 690674654, 1259522838, 277454392]],
  ])('reproduces the MT stream for seed %i', (seed, expected) => {
    const random = new PHPMTRandom(seed);
    expect(expected.map(() => random.next())).toEqual(expected);
  });

  it('keeps the MT stream correct after a state reload', () => {
    const random = new PHPMTRandom(768);
    for (let index = 0; index < 700; index += 1) random.next();
    expect(random.next()).toBe(49898254);
  });

  it.each([
    [1, [1804289383, 846930886, 1681692777, 1714636915]],
    [2147483647, [1065668062, 2142264300, 1066566375, 1064012770]],
    [-8008135, [791676115, 1781863512, 1105079286, 549142576]],
  ])('reproduces the rand stream for seed %i', (seed, expected) => {
    const random = new PHPRandom(seed);
    expect(expected.map(() => random.next())).toEqual(expected);
  });

  it('reproduces ranged rolls, selection, and shuffle', () => {
    const mt = new PHPMTRandom(69420);
    expect([mt.nextInt(5), mt.nextInt(10, 20), mt.nextInt(-5, 100)]).toEqual([2, 11, 32]);

    const random = new PHPRandom(69420);
    expect([random.nextInt(5), random.nextInt(10, 20), random.nextInt(-5, 100)]).toEqual([1, 12, 79]);

    const selected = new PHPRandom(6969);
    expect(selected.array(5, 3)).toEqual([0, 2, 3]);
    expect(selected.array(5, 3)).toEqual([1, 2, 4]);

    const values = [1, 2, 3, 4, 5];
    new PHPRandom(1721991).shuffle(values);
    expect(values).toEqual([3, 5, 2, 1, 4]);

    expect(new PHPRandomSelection(new PHPRandom(123), new PHPMTRandom(123)).pick(0, 1)).toEqual([]);
  });
});
