import { describe, expect, it } from 'vitest';
import { DEFAULT_ALLOWED_TYPES, TCRSItem } from '../types';
import { DEFAULT_ITEM_TAG_FILTERS, filterAndSortItems, ItemFilterOptions } from './itemFiltering';

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
    tags: ['Thrifty Accessible', 'Drops / Other'],
    sourceDetails: [],
    ...overrides,
  };
}

const options: ItemFilterOptions = {
  showUnchangedItems: false,
  foodQualityFilter: 'all',
  allowedTags: { ...DEFAULT_ITEM_TAG_FILTERS },
  allowedTypes: { ...DEFAULT_ALLOWED_TYPES, other: true },
  searchQuery: '',
  sortBy: 'name',
};

describe('filterAndSortItems', () => {
  const familiarOnly = item({ itemModifiers: 'Familiar Effect: "4xFairy, cap 8"' });
  const familiarWeight = item({ id: 2, origName: 'Weight item', itemModifiers: 'Familiar Weight: +5' });

  it('hides generic Familiar-only items by default', () => {
    expect(filterAndSortItems([familiarOnly, familiarWeight], options)).toEqual([familiarWeight]);
  });

  it('restores Familiar-only items with the unchanged toggle', () => {
    expect(
      filterAndSortItems([familiarOnly, familiarWeight], {
        ...options,
        showUnchangedItems: true,
      }),
    ).toHaveLength(2);
  });
});
