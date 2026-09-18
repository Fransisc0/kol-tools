import React, { useState, useMemo, useEffect } from 'react';
import { TCRSItem, ItemTagType, ItemTypeKey, DEFAULT_ALLOWED_TYPES, FoodQualityFilter } from '../types';
import {
  getItemType,
  CONSUMABLE_TYPE_CONFIGS,
  EQUIPMENT_TYPE_CONFIGS,
  ALL_TYPE_CONFIGS,
} from '../utils/itemUtils';
import { DEFAULT_ITEM_TAG_FILTERS, filterAndSortItems, ItemSort } from '../utils/itemFiltering';
import { ItemCard } from './ItemCard';
import { ItemRow } from './ItemRow';
import { SearchableFilterSelect } from './SearchableFilterSelect';
import { ItemLayout } from '../hooks/usePreferences';
import {
  Store,
  Hammer,
  CheckCircle2,
  Ban,
  Utensils,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { ItemListToolbar, PageSize } from './ItemListToolbar';

export type { ItemTypeKey, FoodQualityFilter };
export { getItemType, CONSUMABLE_TYPE_CONFIGS, EQUIPMENT_TYPE_CONFIGS };

const defaultTypes: Record<ItemTypeKey, boolean> = { ...DEFAULT_ALLOWED_TYPES };

export interface ItemListProps {
  title: string;
  subtitle?: string;
  items: TCRSItem[];
  categoryKey: string;
  allowedTags?: Record<string, boolean>;
  setAllowedTags?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allowedTypes?: Record<ItemTypeKey, boolean>;
  setAllowedTypes?: React.Dispatch<React.SetStateAction<Record<ItemTypeKey, boolean>>>;
  showUnchangedItems?: boolean;
  foodQualityFilter?: FoodQualityFilter;
  setFoodQualityFilter?: (filter: FoodQualityFilter) => void;
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
  const [internalAllowedTags, setInternalAllowedTags] =
    useState<Record<string, boolean>>(DEFAULT_ITEM_TAG_FILTERS);
  const [internalAllowedTypes, setInternalAllowedTypes] =
    useState<Record<ItemTypeKey, boolean>>(defaultTypes);
  const [internalFoodQuality, setInternalFoodQuality] = useState<FoodQualityFilter>('awesome-plus');
  const [internalItemLayout, setInternalItemLayout] = useState<ItemLayout>('card');

  const itemLayout = propsItemLayout ?? internalItemLayout;
  const setItemLayout = propsSetItemLayout ?? setInternalItemLayout;

  const allowedTags: Record<string, boolean> = useMemo(
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

  const [searchQuery, setSearchQuery] = useState('');

  // Items per page option: 24, 48, 96, 'all' (default 24)
  const [pageSize, setPageSize] = useState<PageSize>(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting: Automatically organized in order of most to least of their effect by default
  const [sortBy, setSortBy] = useState<ItemSort>('bonus_desc');

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    sortBy,
    showUnchangedItems,
    foodQualityFilter,
    allowedTags,
    allowedTypes,
    categoryKey,
    activeSubCategory,
    pageSize,
  ]);

  // Toggle single tag
  const toggleTag = (tag: ItemTagType) => {
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

  const processedItems = useMemo(
    () =>
      filterAndSortItems(items, {
        showUnchangedItems,
        foodQualityFilter,
        allowedTags,
        allowedTypes,
        searchQuery,
        sortBy,
      }),
    [items, showUnchangedItems, foodQualityFilter, allowedTags, allowedTypes, searchQuery, sortBy],
  );

  // Pagination calculation
  const totalItems = processedItems.length;
  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return processedItems;
    const start = (currentPage - 1) * effectivePageSize;
    return processedItems.slice(start, start + effectivePageSize);
  }, [processedItems, currentPage, effectivePageSize, pageSize]);

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

        {/* Row 2 (Desktop only): Availability & Sources Filters */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] mr-0.5">Availability:</span>

            <button
              type="button"
              onClick={() => toggleTag('Thrifty Accessible')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['Thrifty Accessible']
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2
                className={`w-3 h-3 ${allowedTags['Thrifty Accessible'] ? 'text-emerald-600' : 'text-slate-300'}`}
              />
              <span>Thrifty</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTag('Non-Thrifty')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['Non-Thrifty']
                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Ban className={`w-3 h-3 ${allowedTags['Non-Thrifty'] ? 'text-rose-600' : 'text-slate-300'}`} />
              <span>Non-Thrifty</span>
            </button>

            <span className="text-slate-200 mx-0.5">|</span>

            <button
              type="button"
              onClick={() => toggleTag('NPC Store')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['NPC Store']
                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Store className={`w-3 h-3 ${allowedTags['NPC Store'] ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>NPC Store</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTag('Craftable')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['Craftable']
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Hammer
                className={`w-3 h-3 ${allowedTags['Craftable'] ? 'text-amber-600' : 'text-slate-300'}`}
              />
              <span>Craftable</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTag('Drops / Other')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['Drops / Other']
                  ? 'bg-slate-100 text-slate-800 border-slate-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles
                className={`w-3 h-3 ${allowedTags['Drops / Other'] ? 'text-slate-600' : 'text-slate-300'}`}
              />
              <span>Drops</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTag('The Sea')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                allowedTags['The Sea']
                  ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>🌊 The Sea</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] ml-auto">
            <button
              type="button"
              onClick={setThriftyOnly}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Thrifty Only
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={selectAllTags}
              className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              All Sources
            </button>
          </div>
        </div>

        {/* Row 3 (Desktop only): Item Types Filter (Chips with live counts) */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
            <span className="text-slate-400 font-medium text-[11px] mr-0.5 shrink-0">Types:</span>

            {availableTypes.map((cfg) => {
              const Icon = cfg.icon;
              const isAllowed = Boolean(allowedTypes[cfg.key]);
              const count = typeCounts[cfg.key] || 0;

              return (
                <button
                  type="button"
                  key={cfg.key}
                  onClick={() => toggleType(cfg.key)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer shrink-0 ${
                    isAllowed
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs font-semibold'
                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isAllowed ? 'text-white' : 'text-slate-400'}`} />
                  <span>{cfg.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isAllowed ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] ml-auto shrink-0">
            <button
              type="button"
              onClick={selectConsumablesOnly}
              className="text-amber-700 hover:underline font-medium cursor-pointer"
            >
              Consumables
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={selectGearOnly}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Gear
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={selectAllTypes}
              className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              All Types
            </button>
          </div>
        </div>

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
