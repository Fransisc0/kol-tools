import { DEFAULT_ALLOWED_TAGS, FoodQualityFilter, ItemTypeKey, TCRSItem } from '../types';
import { getItemType, isBoozeQualityMatch, isFoodQualityMatch, isUnchangedItem } from './itemUtils';

export type ItemSort = 'bonus_desc' | 'bonus_asc' | 'duration' | 'name' | 'id';

export interface ItemFilterOptions {
  showUnchangedItems: boolean;
  foodQualityFilter: FoodQualityFilter;
  allowedTags: Record<string, boolean>;
  allowedTypes: Record<ItemTypeKey, boolean>;
  searchQuery: string;
  sortBy: ItemSort;
}

function matchesQuality(item: TCRSItem, foodQualityFilter: FoodQualityFilter): boolean {
  const type = getItemType(item);
  if (type === 'food') return isFoodQualityMatch(item.quality, foodQualityFilter);
  if (type === 'booze') return isBoozeQualityMatch(item.quality);
  return true;
}

function matchesTags(item: TCRSItem, allowedTags: Record<string, boolean>): boolean {
  if (item.tags.includes('The Sea') && allowedTags['The Sea'] === false) return false;

  const isThrifty = item.tags.includes('Thrifty Accessible');
  const isNonThrifty = item.tags.includes('Non-Thrifty');
  const allowThrifty = allowedTags['Thrifty Accessible'] !== false;
  const allowNonThrifty = allowedTags['Non-Thrifty'] === true;
  if (allowThrifty !== allowNonThrifty) {
    if (allowThrifty && !isThrifty) return false;
    if (allowNonThrifty && !isNonThrifty) return false;
  } else if (!allowThrifty) {
    return false;
  }

  const isNpcStore = item.tags.includes('NPC Store');
  const isCraftable = item.tags.includes('Craftable') || item.tags.includes('Easily Craftable Recipe');
  const isDrop = !isNpcStore && !isCraftable;
  const allowCraft = allowedTags.Craftable !== false && allowedTags['Easily Craftable Recipe'] !== false;

  return (
    (isNpcStore && allowedTags['NPC Store'] !== false) ||
    (isCraftable && allowCraft) ||
    (isDrop && allowedTags['Drops / Other'] !== false)
  );
}

function matchesSearch(item: TCRSItem, query: string): boolean {
  if (!query) return true;
  return (
    item.tcrsName.toLowerCase().includes(query) ||
    item.origName.toLowerCase().includes(query) ||
    Boolean(item.effectName?.toLowerCase().includes(query)) ||
    Boolean(item.effectModifiers?.toLowerCase().includes(query)) ||
    item.itemModifiers.toLowerCase().includes(query) ||
    Boolean(item.extractedStat?.toLowerCase().includes(query)) ||
    item.sourceDetails.some((source) => source.toLowerCase().includes(query)) ||
    item.id.toString() === query
  );
}

function byNameThenId(a: TCRSItem, b: TCRSItem): number {
  return a.origName.localeCompare(b.origName, undefined, { sensitivity: 'base' }) || a.id - b.id;
}

function compareItems(a: TCRSItem, b: TCRSItem, sortBy: ItemSort): number {
  if (sortBy === 'bonus_desc') {
    if (a.isEquipment !== b.isEquipment) return a.isEquipment ? 1 : -1;
    return (b.extractedNumericBonus || 0) - (a.extractedNumericBonus || 0) || byNameThenId(a, b);
  }
  if (sortBy === 'bonus_asc') {
    return (a.extractedNumericBonus || 0) - (b.extractedNumericBonus || 0) || byNameThenId(a, b);
  }
  if (sortBy === 'duration') {
    return (b.effectDuration ?? -1) - (a.effectDuration ?? -1) || byNameThenId(a, b);
  }
  if (sortBy === 'name') return byNameThenId(a, b);
  return a.id - b.id;
}

export function filterAndSortItems(items: TCRSItem[], options: ItemFilterOptions): TCRSItem[] {
  const query = options.searchQuery.trim().toLowerCase();
  return items
    .filter((item) => options.showUnchangedItems || !isUnchangedItem(item))
    .filter((item) => matchesQuality(item, options.foodQualityFilter))
    .filter((item) => matchesTags(item, options.allowedTags))
    .filter((item) => Boolean(options.allowedTypes[getItemType(item)]))
    .filter((item) => matchesSearch(item, query))
    .sort((a, b) => compareItems(a, b, options.sortBy));
}

export const DEFAULT_ITEM_TAG_FILTERS: Record<string, boolean> = {
  ...DEFAULT_ALLOWED_TAGS,
};
