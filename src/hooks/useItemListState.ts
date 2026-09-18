import { useEffect, useMemo, useState } from 'react';
import type { AllowedTags, BoozeQualityFilter, FoodQualityFilter, ItemTypeKey, TCRSItem } from '../types';
import type { PageSize } from '../components/ItemListToolbar';
import { filterAndSortItems, type ItemSort } from '../utils/itemFiltering';

interface ItemListStateOptions {
  items: TCRSItem[];
  categoryKey: string;
  activeSubCategory?: string;
  allowedTags: AllowedTags;
  allowedTypes: Record<ItemTypeKey, boolean>;
  showUnchangedItems: boolean;
  foodQualityFilter: FoodQualityFilter;
  boozeQualityFilter: BoozeQualityFilter;
}

export function useItemListState(options: ItemListStateOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>(24);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<ItemSort>('bonus_desc');

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    sortBy,
    options.showUnchangedItems,
    options.foodQualityFilter,
    options.boozeQualityFilter,
    options.allowedTags,
    options.allowedTypes,
    options.categoryKey,
    options.activeSubCategory,
    pageSize,
  ]);

  const processedItems = useMemo(
    () =>
      filterAndSortItems(options.items, {
        showUnchangedItems: options.showUnchangedItems,
        foodQualityFilter: options.foodQualityFilter,
        boozeQualityFilter: options.boozeQualityFilter,
        allowedTags: options.allowedTags,
        allowedTypes: options.allowedTypes,
        searchQuery,
        sortBy,
      }),
    [options, searchQuery, sortBy],
  );

  const totalItems = processedItems.length;
  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return processedItems;
    const start = (currentPage - 1) * effectivePageSize;
    return processedItems.slice(start, start + effectivePageSize);
  }, [processedItems, pageSize, currentPage, effectivePageSize]);

  return {
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
  };
}
