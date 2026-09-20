import { describe, expect, it } from 'vitest';

import { parseRollTables } from './rollTables';

describe('ordered KoLmafia TCRS roll tables', () => {
  const minimal = [
    'Color\tred',
    'Color\tblue',
    'Cosmetic\twobbly',
    'Potion Mod\tstrong',
    'Potion Prefix\tsuper',
    'Food Enchantment\tenchanted',
    'Adjective\told',
    'Food Size\t1\ttiny',
    'Food Quality\tEPIC\tepic',
    'Equipment Enchant\tof vigor\tMaximum HP: 10',
  ].join('\n');

  it('keeps insertion order and duplicate entries because RNG indices refer to positions', () => {
    const tables = parseRollTables(`${minimal}\nColor\tred\n`);
    expect(tables.words.get('Color')).toEqual(['red', 'blue', 'red']);
    expect(tables.foodSizes.get(1)).toEqual(['tiny']);
    expect(tables.equipmentEnchantments).toEqual([{ adjective: 'of vigor', modifier: 'Maximum HP: 10' }]);
  });

  it('rejects incomplete inputs instead of changing the roll sequence', () => {
    expect(() => parseRollTables('Color\tred')).toThrow('Missing TCRS roll table');
  });
});
