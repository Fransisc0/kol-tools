import { describe, expect, it } from 'vitest';

import reviewedRollTables from '../../../../scripts/fixtures/reviewed-tcrs-roll-tables.txt?raw';

import {
  deriveEquipmentRolls,
  deriveFoodBoozeRolls,
  deriveGenericRolls,
  derivePotionRolls,
  deriveSpleenRolls,
  seedFor,
  type EffectCandidate,
} from './derivationRolls';
import { parseRollTables } from './rollTables';

// Reviewed KoLmafia table order and independent Java output at commit 4ab52c3.
const tables = parseRollTables(reviewedRollTables);
const effect = (name: string): EffectCandidate => ({
  id: 1,
  name,
  quality: 'good',
  noHookah: false,
  notTcrs: false,
  ambiguous: false,
});

describe('reviewed KoLmafia TCRS derivation examples', () => {
  it('uses the class/sign/item seed without conflating numeric identifiers', () => {
    expect(seedFor(297, 'Seal_Clubber', 'Mongoose')).toBe(127195);
    expect(seedFor(297, 'Turtle_Tamer', 'Platypus')).toBe(264230);
    expect(seedFor(297, 'Disco_Bandit', 'Packrat')).toBe(625955);
    expect(() => seedFor(297, '../invalid', 'Mongoose')).toThrow('Unsupported');
  });

  it('preserves generic cosmetics and equipment seed-plus-ten stream ordering', () => {
    expect(deriveGenericRolls(1, 'seal-clubbing club', 'Seal_Clubber', 'Mongoose', tables)).toBe(
      'mirror seal-clubbing club',
    );
    expect(deriveGenericRolls(1, 'seal-clubbing club', 'Turtle_Tamer', 'Platypus', tables)).toBe(
      'seal-clubbing club',
    );
    const modifiers = [
      { name: 'Muscle', value: '+1' },
      { name: 'Familiar Effect', value: '"atk, cap 2"' },
    ];
    const one = deriveEquipmentRolls(
      3,
      'helmet turtle',
      modifiers,
      'Seal_Clubber',
      'Mongoose',
      tables,
      new Set(['muscle']),
    );
    const other = deriveEquipmentRolls(
      3,
      'helmet turtle',
      modifiers,
      'Turtle_Tamer',
      'Platypus',
      tables,
      new Set(['muscle']),
    );
    expect(one.name).toBe('bouncing blinking helmet turtle of the overflowing toilet');
    expect(one.selectedModifiers).toEqual(['Stench Spell Damage: +50']);
    expect(other.name).toBe("smartaleck's helmet turtle");
    expect(other.selectedModifiers).toEqual(['Moxie Percent: +30']);
  });

  it('matches potion, spleen, food, and booze rolls across combinations', () => {
    expect(
      derivePotionRolls(297, 'tamarind-flavored chewing gum', 'Seal_Clubber', 'Mongoose', tables, [
        effect("Hip to Be Square Dancin'"),
      ]),
    ).toEqual({
      name: 'anodized electrified tamarind-flavored chewing gum',
      effect: "Hip to Be Square Dancin'",
      duration: 19,
    });
    expect(
      deriveSpleenRolls(14, 'moxie weed', 'Seal_Clubber', 'Mongoose', tables, [effect('Bright!')]),
    ).toEqual({
      name: 'boiled moxie weed',
      size: 1,
      quality: 'CRAPPY',
      effect: 'Bright!',
      duration: 30,
    });
    expect(
      deriveFoodBoozeRolls(
        { id: 17, name: 'spicy noodles', isFood: true, isBeverage: false, baseAdventures: 9 },
        'Seal_Clubber',
        'Mongoose',
        tables,
        [effect('unused')],
      ),
    ).toEqual({
      name: 'decent gigantic noodles',
      size: 10,
      quality: 'GOOD',
      effect: undefined,
      duration: undefined,
    });
    expect(
      deriveFoodBoozeRolls(
        { id: 41, name: 'ice-cold Sir Schlitz', isFood: false, isBeverage: false, baseAdventures: 1 },
        'Disco_Bandit',
        'Packrat',
        tables,
        [effect('unused')],
      ),
    ).toEqual({
      name: 'lousy practically non-alcoholic ice-cold Sir Schlitz',
      size: 1,
      quality: 'DECENT',
      effect: undefined,
      duration: undefined,
    });
  });
});
