import { describe, expect, it } from 'vitest';
import { TCRSItem } from '../types';
import { decodeHtmlEntities, getMeaningfulItemModifiers, isFunctionallyUnchanged } from './itemSemantics';

function item(overrides: Partial<TCRSItem> = {}): TCRSItem {
  return {
    id: 1,
    origName: 'Original item',
    tcrsName: 'generated item',
    size: 0,
    quality: '',
    primaryUse: 'familiar',
    isPotion: false,
    isEquipment: true,
    isCafe: false,
    itemModifiers: '',
    extractedNumericBonus: 0,
    tags: ['Drops / Other'],
    sourceDetails: [],
    ...overrides,
  };
}

describe('isFunctionallyUnchanged', () => {
  it('treats a generic Familiar Effect as unchanged despite a generated name', () => {
    expect(isFunctionallyUnchanged(item({ itemModifiers: 'Familiar Effect: "4xFairy, cap 8"' }))).toBe(true);
  });

  it('ignores availability metadata beside a generic Familiar Effect', () => {
    expect(
      isFunctionallyUnchanged(
        item({
          itemModifiers: 'Familiar Effect: "atk, cap 25", Last Available: "2004-10"',
        }),
      ),
    ).toBe(true);
  });

  it.each(['Familiar Weight: +5', 'Familiar Experience: +2', 'Familiar Experience Percent: +10'])(
    'keeps %s meaningful',
    (itemModifiers) => {
      expect(isFunctionallyUnchanged(item({ itemModifiers }))).toBe(false);
    },
  );

  it('keeps another modifier beside Familiar Effect meaningful', () => {
    expect(
      isFunctionallyUnchanged(
        item({
          itemModifiers: 'Item Drop: +10, Familiar Effect: "4xLep, cap 7"',
        }),
      ),
    ).toBe(false);
  });

  it.each([
    { effectName: 'Useful Effect', effectDuration: 10 },
    { size: 1, quality: 'good' },
    { extractedNumericBonus: 5 },
  ])('does not hide a Familiar item with another functional result', (extra) => {
    expect(isFunctionallyUnchanged(item({ itemModifiers: 'Familiar Effect: "atk"', ...extra }))).toBe(false);
  });
});

describe('modifier and entity normalization', () => {
  it('removes structural metadata without removing real familiar bonuses', () => {
    expect(getMeaningfulItemModifiers('Familiar Effect: "atk, cap 5", Familiar Weight: +3')).toBe(
      'Familiar Weight: +3',
    );
  });

  it('decodes named and numeric HTML entities', () => {
    expect(decodeHtmlEntities('Ben-Gal&trade; and jalape&ntilde;o &#332;')).toBe('Ben-Gal™ and jalapeño Ō');
  });
});
