import { useState, useEffect } from 'react';
import {
  ItemTypeKey,
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_FOOD_QUALITY_FILTER,
  DEFAULT_BOOZE_QUALITY_FILTER,
  DEFAULT_SHOW_UNCHANGED_ITEMS,
  DEFAULT_THRIFTY_MODE,
  ThriftyMode,
  FoodQualityFilter,
  BoozeQualityFilter,
} from '../types';

export type ItemLayout = 'card' | 'line';

const VALID_FOOD_QUALITIES: ReadonlySet<string> = new Set(['awesome-plus', 'epic', 'awesome', 'all']);
const VALID_BOOZE_QUALITIES: ReadonlySet<string> = new Set(['epic', 'all']);

export function normalizeBoozeQualityFilter(value: string | null): BoozeQualityFilter {
  return value && VALID_BOOZE_QUALITIES.has(value)
    ? (value as BoozeQualityFilter)
    : DEFAULT_BOOZE_QUALITY_FILTER;
}

type AllowedTags = { [K in keyof typeof DEFAULT_ALLOWED_TAGS]: boolean };

function createDefaultAllowedTags(): AllowedTags {
  return { ...DEFAULT_ALLOWED_TAGS };
}

export function usePreferences() {
  const [itemLayout, setItemLayout] = useState<ItemLayout>(() => {
    try {
      const saved = localStorage.getItem('tcrs_item_layout');
      if (saved === 'card' || saved === 'line') {
        return saved;
      }
    } catch {}
    return 'line';
  });

  const [thriftyMode, setThriftyModeState] = useState<ThriftyMode>(() => {
    try {
      const saved = localStorage.getItem('tcrs_thrifty_mode');
      if (saved === 'thrifty' || saved === 'non-thrifty' || saved === 'all') {
        return saved;
      }
    } catch {}
    return DEFAULT_THRIFTY_MODE;
  });

  const [allowedTags, setAllowedTags] = useState<AllowedTags>(() => {
    try {
      const saved = localStorage.getItem('tcrs_allowed_tags');
      const savedMode = (localStorage.getItem('tcrs_thrifty_mode') as ThriftyMode) || 'thrifty';
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            'Thrifty Accessible': savedMode === 'all' || savedMode === 'thrifty',
            'Non-Thrifty': savedMode === 'all' || savedMode === 'non-thrifty',
            'NPC Store': parsed['NPC Store'] ?? true,
            Craftable: parsed['Craftable'] ?? parsed['Easily Craftable Recipe'] ?? true,
            'Drops / Other': parsed['Drops / Other'] ?? true,
            'The Sea': parsed['The Sea'] ?? true,
          };
        }
      }
    } catch {}
    return createDefaultAllowedTags();
  });

  const [allowedTypes, setAllowedTypes] = useState<Record<ItemTypeKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem('tcrs_allowed_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            ...DEFAULT_ALLOWED_TYPES,
            ...parsed,
            // Ensure 'other' strictly defaults to false unless explicitly true
            other: parsed.other === true,
            // Ensure 'monsterManualPotion' is preserved
            monsterManualPotion: parsed.monsterManualPotion ?? DEFAULT_ALLOWED_TYPES.monsterManualPotion,
          };
        }
      }
    } catch {}
    return { ...DEFAULT_ALLOWED_TYPES };
  });

  const [showUnchangedItems, setShowUnchangedItems] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tcrs_show_unchanged_items');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return DEFAULT_SHOW_UNCHANGED_ITEMS;
  });

  const [foodQualityFilter, setFoodQualityFilter] = useState<FoodQualityFilter>(() => {
    try {
      const saved = localStorage.getItem('tcrs_food_quality_filter');
      if (saved && VALID_FOOD_QUALITIES.has(saved)) {
        return saved as FoodQualityFilter;
      }
    } catch {}
    return DEFAULT_FOOD_QUALITY_FILTER;
  });

  const [boozeQualityFilter, setBoozeQualityFilter] = useState<BoozeQualityFilter>(() => {
    try {
      return normalizeBoozeQualityFilter(localStorage.getItem('tcrs_booze_quality_filter'));
    } catch {
      return DEFAULT_BOOZE_QUALITY_FILTER;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_allowed_tags', JSON.stringify(allowedTags));
    } catch {}
  }, [allowedTags]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_allowed_types', JSON.stringify(allowedTypes));
    } catch {}
  }, [allowedTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_thrifty_mode', thriftyMode);
    } catch {}
  }, [thriftyMode]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_item_layout', itemLayout);
    } catch {}
  }, [itemLayout]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_show_unchanged_items', String(showUnchangedItems));
    } catch {}
  }, [showUnchangedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_food_quality_filter', foodQualityFilter);
    } catch {}
  }, [foodQualityFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('tcrs_booze_quality_filter', boozeQualityFilter);
    } catch {}
  }, [boozeQualityFilter]);

  const setThriftyMode = (mode: ThriftyMode) => {
    setThriftyModeState(mode);
    setAllowedTags((prev) => ({
      ...prev,
      'Thrifty Accessible': mode === 'all' || mode === 'thrifty',
      'Non-Thrifty': mode === 'all' || mode === 'non-thrifty',
    }));
  };

  const toggleTag = (tag: keyof typeof allowedTags) => {
    setAllowedTags((prev) => {
      const next = { ...prev, [tag]: !prev[tag] };
      if (tag === 'Thrifty Accessible' || tag === 'Non-Thrifty') {
        const thrifty = next['Thrifty Accessible'];
        const nonThrifty = next['Non-Thrifty'];
        if (thrifty && nonThrifty) setThriftyModeState('all');
        else if (thrifty && !nonThrifty) setThriftyModeState('thrifty');
        else if (!thrifty && nonThrifty) setThriftyModeState('non-thrifty');
      }
      return next;
    });
  };

  const toggleType = (typeKey: ItemTypeKey) => {
    setAllowedTypes((prev) => ({ ...prev, [typeKey]: !prev[typeKey] }));
  };

  const resetFilters = () => {
    setThriftyModeState(DEFAULT_THRIFTY_MODE);
    setAllowedTags(createDefaultAllowedTags());
    setAllowedTypes({ ...DEFAULT_ALLOWED_TYPES });
    setShowUnchangedItems(DEFAULT_SHOW_UNCHANGED_ITEMS);
    setFoodQualityFilter(DEFAULT_FOOD_QUALITY_FILTER);
    setBoozeQualityFilter(DEFAULT_BOOZE_QUALITY_FILTER);
  };

  return {
    itemLayout,
    setItemLayout,
    allowedTags,
    setAllowedTags,
    thriftyMode,
    setThriftyMode,
    allowedTypes,
    setAllowedTypes,
    showUnchangedItems,
    setShowUnchangedItems,
    foodQualityFilter,
    setFoodQualityFilter,
    boozeQualityFilter,
    setBoozeQualityFilter,
    toggleTag,
    toggleType,
    resetFilters,
  };
}
