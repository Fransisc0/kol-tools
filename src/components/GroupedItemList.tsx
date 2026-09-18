import React, { useMemo } from 'react';
import {
  AllowedTags,
  BoozeQualityFilter,
  FoodQualityFilter,
  ItemTypeKey,
  TCRSDataResponse,
  TCRSItem,
} from '../types';
import { ItemList } from './ItemList';
import { ItemLayout } from '../hooks/usePreferences';
import { categorizeNPCStore } from '../npcStoreMapping';
import { categorizeZone } from '../zoneMapping';

interface GroupedItemListProps {
  data: TCRSDataResponse | null;
  mode: 'NPC Store' | 'Zone' | 'All';
  activeSection: string;
  activeSubCategory: string;
  allowedTags: AllowedTags;
  setAllowedTags?: React.Dispatch<React.SetStateAction<AllowedTags>>;
  allowedTypes: Record<ItemTypeKey, boolean>;
  setAllowedTypes?: React.Dispatch<React.SetStateAction<Record<ItemTypeKey, boolean>>>;
  showUnchangedItems?: boolean;
  foodQualityFilter: FoodQualityFilter;
  setFoodQualityFilter: (val: FoodQualityFilter) => void;
  boozeQualityFilter: BoozeQualityFilter;
  setBoozeQualityFilter: (val: BoozeQualityFilter) => void;
  subCategoryTabs?: { id: string; label: string }[];
  onSelectSubCategory?: (id: string) => void;
  itemLayout?: ItemLayout;
  setItemLayout?: (layout: ItemLayout) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export function GroupedItemList({
  data,
  mode,
  activeSection,
  activeSubCategory,
  allowedTags,
  setAllowedTags,
  allowedTypes,
  setAllowedTypes,
  showUnchangedItems,
  foodQualityFilter,
  setFoodQualityFilter,
  boozeQualityFilter,
  setBoozeQualityFilter,
  subCategoryTabs,
  onSelectSubCategory,
  itemLayout,
  setItemLayout,
  onOpenFilters,
  activeFilterCount,
}: GroupedItemListProps) {
  const finalItems = useMemo(() => {
    if (!data) return [];

    // Use comprehensive allItems parsed directly from TCRS data
    let allItems: TCRSItem[] = data.allItems && data.allItems.length > 0 ? data.allItems : [];
    if (allItems.length === 0) {
      const allItemsMap = new Map<number, TCRSItem>();
      const categories = [
        data.turnGeneration,
        data.generalQuestBuffs,
        data.questSpecificBuffs,
        data.survivalBuffs,
      ];
      for (const cat of categories) {
        if (!cat) continue;
        for (const items of Object.values(cat)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              allItemsMap.set(item.id, item);
            }
          }
        }
      }
      allItems = Array.from(allItemsMap.values());
    }

    if (mode === 'All') {
      return allItems;
    }

    const validItems: TCRSItem[] = [];

    for (const item of allItems) {
      if (mode === 'NPC Store' && item.tags.includes('NPC Store')) {
        for (const d of item.sourceDetails) {
          if (d !== 'In-run Drop / Evergreen Standard' && d !== 'Non-Thrifty' && !d.includes('Recipe')) {
            const category = categorizeNPCStore(d);
            const matchesCategory = activeSection === category;
            const matchesSub =
              !activeSubCategory ||
              activeSubCategory === '__NONE__' ||
              activeSubCategory === '__ALL__' ||
              d === activeSubCategory;
            if (matchesCategory && matchesSub) {
              validItems.push(item);
            }
          }
        }
      } else if (mode === 'Zone') {
        const zones = item.zones || [];
        for (const loc of zones) {
          const category = categorizeZone(loc);
          const matchesCategory = category === activeSection;
          const matchesSub =
            !activeSubCategory ||
            activeSubCategory === '__NONE__' ||
            activeSubCategory === '__ALL__' ||
            loc === activeSubCategory;
          if (matchesCategory && matchesSub) {
            validItems.push(item);
          }
        }
      }
    }

    const dedupeMap = new Map<number, TCRSItem>();
    for (const item of validItems) {
      dedupeMap.set(item.id, item);
    }
    return Array.from(dedupeMap.values());
  }, [data, mode, activeSection, activeSubCategory]);

  if (!data) return null;

  const title =
    mode === 'All'
      ? 'All Items'
      : activeSubCategory && activeSubCategory !== '__NONE__' && activeSubCategory !== '__ALL__'
        ? activeSubCategory
        : `${activeSection} (All)`;

  return (
    <ItemList
      title={title}
      subtitle={mode === 'All' ? 'Every TCRS item parsed from official data' : ''}
      items={finalItems}
      allowedTags={allowedTags}
      setAllowedTags={setAllowedTags}
      allowedTypes={allowedTypes}
      setAllowedTypes={setAllowedTypes}
      showUnchangedItems={showUnchangedItems}
      foodQualityFilter={foodQualityFilter}
      setFoodQualityFilter={setFoodQualityFilter}
      boozeQualityFilter={boozeQualityFilter}
      setBoozeQualityFilter={setBoozeQualityFilter}
      categoryKey={mode === 'All' ? 'all' : 'grouped'}
      subCategoryTabs={subCategoryTabs}
      subCategoryLabel={mode === 'NPC Store' ? 'Store' : 'Zone'}
      subCategoryAllOptionLabel={mode === 'NPC Store' ? 'All stores' : 'All zones'}
      activeSubCategory={activeSubCategory}
      onSelectSubCategory={onSelectSubCategory}
      itemLayout={itemLayout}
      setItemLayout={setItemLayout}
      onOpenFilters={onOpenFilters}
      activeFilterCount={activeFilterCount}
    />
  );
}
