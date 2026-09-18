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
  boozeQualityFilter: 'epic',
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

  it('shows only EPIC booze by default', () => {
    const epic = item({
      id: 10,
      origName: 'Epic booze',
      primaryUse: 'drink',
      isEquipment: false,
      quality: 'EPIC',
    });
    const awesome = item({
      id: 11,
      origName: 'Awesome booze',
      primaryUse: 'drink',
      isEquipment: false,
      quality: 'awesome',
    });
    const decent = item({
      id: 12,
      origName: 'Decent booze',
      primaryUse: 'drink',
      isEquipment: false,
      quality: 'decent',
    });

    expect(filterAndSortItems([awesome, decent, epic], options)).toEqual([epic]);
  });

  it('restores every booze quality without changing the food filter', () => {
    const epicBooze = item({
      id: 20,
      origName: 'Epic booze',
      primaryUse: 'drink',
      isEquipment: false,
      quality: 'EPIC',
    });
    const goodBooze = item({
      id: 21,
      origName: 'Good booze',
      primaryUse: 'drink',
      isEquipment: false,
      quality: 'good',
    });
    const epicFood = item({
      id: 22,
      origName: 'Epic food',
      primaryUse: 'food',
      isEquipment: false,
      quality: 'EPIC',
    });
    const goodFood = item({
      id: 23,
      origName: 'Good food',
      primaryUse: 'food',
      isEquipment: false,
      quality: 'good',
    });

    const result = filterAndSortItems([epicBooze, goodBooze, epicFood, goodFood], {
      ...options,
      boozeQualityFilter: 'all',
      foodQualityFilter: 'epic',
    });

    expect(result).toEqual([epicBooze, epicFood, goodBooze]);
  });
});
