import React, { useState, useMemo } from 'react';
import {
  AllowedTags,
  AllowedTagKey,
  BoozeQualityFilter,
  DEFAULT_ALLOWED_TYPES,
  FoodQualityFilter,
  ItemTypeKey,
  TCRSItem,
} from '../types';
import { getItemType } from '../utils/itemUtils';
import { ALL_TYPE_CONFIGS, CONSUMABLE_TYPE_CONFIGS, EQUIPMENT_TYPE_CONFIGS } from '../config/itemTypes';
import { DEFAULT_ITEM_TAG_FILTERS } from '../utils/itemFiltering';
import { ItemCard } from './ItemCard';
import { ItemRow } from './ItemRow';
import { SearchableFilterSelect } from './SearchableFilterSelect';
import { ItemLayout } from '../hooks/usePreferences';
import { Utensils, Wine, Sparkles, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { ItemListToolbar } from './ItemListToolbar';
import { useItemListState } from '../hooks/useItemListState';
import { ItemListDesktopFilters } from './ItemListDesktopFilters';

export type { ItemTypeKey, FoodQualityFilter };
export { getItemType, CONSUMABLE_TYPE_CONFIGS, EQUIPMENT_TYPE_CONFIGS };

const defaultTypes: Record<ItemTypeKey, boolean> = { ...DEFAULT_ALLOWED_TYPES };

export interface ItemListProps {
  title: string;
  subtitle?: string;
  items: TCRSItem[];
  categoryKey: string;
  allowedTags?: AllowedTags;
  setAllowedTags?: React.Dispatch<React.SetStateAction<AllowedTags>>;
  allowedTypes?: Record<ItemTypeKey, boolean>;
  setAllowedTypes?: React.Dispatch<React.SetStateAction<Record<ItemTypeKey, boolean>>>;
  showUnchangedItems?: boolean;
  foodQualityFilter?: FoodQualityFilter;
  setFoodQualityFilter?: (filter: FoodQualityFilter) => void;
  boozeQualityFilter?: BoozeQualityFilter;
  setBoozeQualityFilter?: (filter: BoozeQualityFilter) => void;
  subCategoryTabs?: { id: string; label: string }[];
  activeSubCategory?: string;
  onSelectSubCategory?: (id: string) => void;
  subCategoryLabel?: string;
  subCategoryAllOptionLabel?: string;
  subCategoryIncludeAll?: boolean;
  itemLayout?: ItemLayout;
  setItemLayout?: (layout: ItemLayout) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export const ItemList: React.FC<ItemListProps> = ({
  title,
  subtitle: _subtitle,
  items,
  categoryKey,
  allowedTags: propsAllowedTags,
  setAllowedTags: propsSetAllowedTags,
  allowedTypes: propsAllowedTypes,
  setAllowedTypes: propsSetAllowedTypes,
  showUnchangedItems = false,
  foodQualityFilter: propsFoodQualityFilter,
  setFoodQualityFilter: propsSetFoodQualityFilter,
  boozeQualityFilter: propsBoozeQualityFilter,
  setBoozeQualityFilter: propsSetBoozeQualityFilter,
  subCategoryTabs,
  activeSubCategory,
  onSelectSubCategory,
  subCategoryLabel = 'Category',
  subCategoryAllOptionLabel = 'All categories',
  subCategoryIncludeAll = true,
  itemLayout: propsItemLayout,
  setItemLayout: propsSetItemLayout,
  onOpenFilters,
  activeFilterCount,
}) => {
  const [internalAllowedTags, setInternalAllowedTags] = useState<AllowedTags>(DEFAULT_ITEM_TAG_FILTERS);
  const [internalAllowedTypes, setInternalAllowedTypes] =
    useState<Record<ItemTypeKey, boolean>>(defaultTypes);
  const [internalFoodQuality, setInternalFoodQuality] = useState<FoodQualityFilter>('awesome-plus');
  const [internalBoozeQuality, setInternalBoozeQuality] = useState<BoozeQualityFilter>('epic');
  const [internalItemLayout, setInternalItemLayout] = useState<ItemLayout>('card');

  const itemLayout = propsItemLayout ?? internalItemLayout;
  const setItemLayout = propsSetItemLayout ?? setInternalItemLayout;

  const allowedTags: AllowedTags = useMemo(
    () => ({
      ...DEFAULT_ITEM_TAG_FILTERS,
      ...(propsSetAllowedTags ? propsAllowedTags || {} : internalAllowedTags || {}),
    }),
    [propsAllowedTags, propsSetAllowedTags, internalAllowedTags],
  );

  const setAllowedTags = propsSetAllowedTags || setInternalAllowedTags;

  const allowedTypes: Record<ItemTypeKey, boolean> = useMemo(
    () => ({
      ...defaultTypes,
      ...(propsSetAllowedTypes ? propsAllowedTypes || {} : internalAllowedTypes || {}),
    }),
    [propsAllowedTypes, propsSetAllowedTypes, internalAllowedTypes],
  );

  const setAllowedTypes = propsSetAllowedTypes || setInternalAllowedTypes;
  const foodQualityFilter =
    propsFoodQualityFilter !== undefined ? propsFoodQualityFilter : internalFoodQuality;
  const setFoodQualityFilter = propsSetFoodQualityFilter || setInternalFoodQuality;
  const boozeQualityFilter = propsBoozeQualityFilter ?? internalBoozeQuality;
  const setBoozeQualityFilter = propsSetBoozeQualityFilter || setInternalBoozeQuality;

  const {
    searchQuery,
    setSearchQuery,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    totalItems,
    totalPages,
    paginatedItems,
  } = useItemListState({
    items,
    categoryKey,
    activeSubCategory,
    allowedTags,
    allowedTypes,
    showUnchangedItems,
    foodQualityFilter,
    boozeQualityFilter,
  });

  // Toggle single tag
  const toggleTag = (tag: AllowedTagKey) => {
    setAllowedTags((prev) => {
      const base = prev || DEFAULT_ITEM_TAG_FILTERS;
      return {
        ...DEFAULT_ITEM_TAG_FILTERS,
        ...base,
        [tag]: !(base[tag] !== undefined ? base[tag] : DEFAULT_ITEM_TAG_FILTERS[tag]),
      };
    });
    setCurrentPage(1);
  };

  const setThriftyOnly = () => {
    setAllowedTags({
      'Thrifty Accessible': true,
      'NPC Store': true,
      Craftable: true,
      'Non-Thrifty': false,
      'Drops / Other': true,
      'The Sea': true,
    });
    setCurrentPage(1);
  };

  const selectAllTags = () => {
    setAllowedTags({
      'Thrifty Accessible': true,
      'NPC Store': true,
      Craftable: true,
      'Non-Thrifty': true,
      'Drops / Other': true,
      'The Sea': true,
    });
    setCurrentPage(1);
  };

  // Toggle item type (Row 2)
  const toggleType = (typeKey: ItemTypeKey) => {
    setAllowedTypes((prev) => {
      const base = prev || defaultTypes;
      return {
        ...defaultTypes,
        ...base,
        [typeKey]: !(base[typeKey] !== undefined ? base[typeKey] : defaultTypes[typeKey]),
      };
    });
    setCurrentPage(1);
  };

  const selectAllTypes = () => {
    const next: Record<ItemTypeKey, boolean> = { ...DEFAULT_ALLOWED_TYPES };
    ALL_TYPE_CONFIGS.forEach((c) => {
      next[c.key] = true;
    });
    setAllowedTypes(next);
    setCurrentPage(1);
  };

  const selectGearOnly = () => {
    const next: Record<ItemTypeKey, boolean> = { ...DEFAULT_ALLOWED_TYPES };
    CONSUMABLE_TYPE_CONFIGS.forEach((c) => {
      next[c.key] = false;
    });
    EQUIPMENT_TYPE_CONFIGS.forEach((c) => {
      next[c.key] = true;
    });
    setAllowedTypes(next);
    setCurrentPage(1);
  };

  const selectConsumablesOnly = () => {
    const next: Record<ItemTypeKey, boolean> = { ...DEFAULT_ALLOWED_TYPES };
    CONSUMABLE_TYPE_CONFIGS.forEach((c) => {
      next[c.key] = true;
    });
    EQUIPMENT_TYPE_CONFIGS.forEach((c) => {
      next[c.key] = false;
    });
    setAllowedTypes(next);
    setCurrentPage(1);
  };

  // Compute live type counts
  const typeCounts = useMemo(() => {
    const counts: Record<ItemTypeKey, number> = {
      food: 0,
      booze: 0,
      spleen: 0,
      potion: 0,
      monsterManualPotion: 0,
      hat: 0,
      container: 0,
      shirt: 0,
      weapon: 0,
      offhand: 0,
      pants: 0,
      accessory: 0,
      familiar: 0,
      other: 0,
    };
    for (const it of items) {
      const t = getItemType(it);
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Types available in this category (with count > 0, or standard slots if none)
  const availableTypes = useMemo(() => {
    const existing = ALL_TYPE_CONFIGS.filter((c) => (typeCounts[c.key] || 0) > 0);
    if (existing.length > 0) return existing;
    return ALL_TYPE_CONFIGS.filter((c) => c.key !== 'other');
  }, [typeCounts]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* 1. Standalone Lightweight Sub-category Navigation Strip */}
      {subCategoryTabs && subCategoryTabs.length > 0 && (
        <SearchableFilterSelect
          options={subCategoryTabs}
          value={activeSubCategory}
          onChange={(value) => onSelectSubCategory?.(value)}
          label={subCategoryLabel}
          allOptionLabel={subCategoryAllOptionLabel}
          includeAllOption={subCategoryIncludeAll}
        />
      )}

      {/* 2. Streamlined Result Controls Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs mb-2 shrink-0 space-y-1.5">
        {/* Row 1: Title & count, Desktop Quality Filter, and Mobile View/Filters controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-none truncate">
              {title}
            </h3>
            <span className="text-xs text-slate-400 font-medium shrink-0">
              {totalItems} of {items.length}
            </span>

            {/* Food quality selector - Desktop only (available in mobile drawer) */}
            {categoryKey === 'food' && (
              <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-200 text-xs">
                <Utensils className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                <span className="text-slate-500 font-medium text-[11px] mr-1">Quality:</span>
                {(
                  [
                    { id: 'awesome-plus', label: 'Awesome+' },
                    { id: 'epic', label: 'EPIC' },
                    { id: 'awesome', label: 'Awesome' },
                    { id: 'all', label: 'All' },
                  ] as const
                ).map((q) => (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => {
                      setFoodQualityFilter?.(q.id);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                      foodQualityFilter === q.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            {categoryKey === 'booze' && (
              <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-200 text-xs">
                <Wine className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                <span className="text-slate-500 font-medium text-[11px] mr-1">Quality:</span>
                {(
                  [
                    { id: 'epic', label: 'EPIC' },
                    { id: 'all', label: 'All' },
                  ] as const
                ).map((quality) => (
                  <button
                    type="button"
                    key={quality.id}
                    onClick={() => {
                      setBoozeQualityFilter(quality.id);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                      boozeQualityFilter === quality.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {quality.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile top-right controls: Layout selector & Filters button (with 40px touch targets) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {/* Cards vs Line mode on mobile */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setItemLayout('card')}
                title="Cards view"
                aria-label="Cards view"
                className={`p-1.5 rounded-md transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center ${
                  itemLayout === 'card'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setItemLayout('line')}
                title="Line view"
                aria-label="Line view"
                className={`p-1.5 rounded-md transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center ${
                  itemLayout === 'line'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Filters button with active count */}
            {onOpenFilters && (
              <button
                type="button"
                onClick={onOpenFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[34px]"
                aria-label="Open Filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Filters</span>
                {Boolean(activeFilterCount && activeFilterCount > 0) && (
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <ItemListDesktopFilters
          allowedTags={allowedTags}
          allowedTypes={allowedTypes}
          availableTypes={availableTypes}
          typeCounts={typeCounts}
          onToggleTag={toggleTag}
          onToggleType={toggleType}
          onThriftyOnly={setThriftyOnly}
          onAllSources={selectAllTags}
          onConsumablesOnly={selectConsumablesOnly}
          onGearOnly={selectGearOnly}
          onAllTypes={selectAllTypes}
        />

        <ItemListToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          itemLayout={itemLayout}
          onLayoutChange={setItemLayout}
        />
      </div>

      {/* 2. Scrollable Items Grid / List Container */}
      <div className="flex-1 overflow-y-auto pr-0.5 sm:pr-1 min-h-0">
        {paginatedItems.length === 0 ? (
          <div className="text-center py-10 sm:py-12 px-4 bg-white rounded-xl sm:rounded-2xl border border-dashed border-slate-300">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-slate-700">No items match your active filters</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search term, enabling non-thrifty items, selecting more item types, or
              changing quality thresholds.
            </p>
          </div>
        ) : itemLayout === 'line' ? (
          <div className="space-y-1 sm:space-y-1.5 bg-white sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-slate-200 divide-y divide-slate-100 sm:divide-y-0 overflow-hidden">
            {paginatedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {paginatedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && pageSize !== 'all' && (
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
};
