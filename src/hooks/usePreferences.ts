import { useState, useEffect } from 'react';
import { PREFERENCE_KEYS } from '../config/preferences';
import { readJsonPreference, readPreference, writePreference } from '../utils/safeStorage';
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
  AllowedTags,
} from '../types';

export type ItemLayout = 'card' | 'line';

const VALID_FOOD_QUALITIES: ReadonlySet<string> = new Set(['awesome-plus', 'epic', 'awesome', 'all']);
const VALID_BOOZE_QUALITIES: ReadonlySet<string> = new Set(['epic', 'all']);

export function normalizeBoozeQualityFilter(value: string | null): BoozeQualityFilter {
  return value && VALID_BOOZE_QUALITIES.has(value)
    ? (value as BoozeQualityFilter)
    : DEFAULT_BOOZE_QUALITY_FILTER;
}

function createDefaultAllowedTags(): AllowedTags {
  return { ...DEFAULT_ALLOWED_TAGS };
}

export function usePreferences() {
  const [itemLayout, setItemLayout] = useState<ItemLayout>(() => {
    const saved = readPreference(PREFERENCE_KEYS.itemLayout);
    if (saved === 'card' || saved === 'line') return saved;
    return 'line';
  });

  const [thriftyMode, setThriftyModeState] = useState<ThriftyMode>(() => {
    const saved = readPreference(PREFERENCE_KEYS.thriftyMode);
    if (saved === 'thrifty' || saved === 'non-thrifty' || saved === 'all') return saved;
    return DEFAULT_THRIFTY_MODE;
  });

  const [allowedTags, setAllowedTags] = useState<AllowedTags>(() => {
    const parsed = readJsonPreference(PREFERENCE_KEYS.allowedTags);
    const savedMode = readPreference(PREFERENCE_KEYS.thriftyMode) || 'thrifty';
    if (typeof parsed === 'object' && parsed !== null) {
      const values = parsed as Record<string, unknown>;
      return {
        'Thrifty Accessible': savedMode === 'all' || savedMode === 'thrifty',
        'Non-Thrifty': savedMode === 'all' || savedMode === 'non-thrifty',
        'NPC Store': values['NPC Store'] !== false,
        Craftable: values.Craftable !== false && values['Easily Craftable Recipe'] !== false,
        'Drops / Other': values['Drops / Other'] !== false,
        'The Sea': values['The Sea'] !== false,
      };
    }
    return createDefaultAllowedTags();
  });

  const [allowedTypes, setAllowedTypes] = useState<Record<ItemTypeKey, boolean>>(() => {
    const parsed = readJsonPreference(PREFERENCE_KEYS.allowedTypes);
    if (typeof parsed === 'object' && parsed !== null) {
      const values = parsed as Partial<Record<ItemTypeKey, unknown>>;
      return {
        ...DEFAULT_ALLOWED_TYPES,
        ...Object.fromEntries(
          Object.keys(DEFAULT_ALLOWED_TYPES).map((key) => [
            key,
            typeof values[key as ItemTypeKey] === 'boolean'
              ? values[key as ItemTypeKey]
              : DEFAULT_ALLOWED_TYPES[key as ItemTypeKey],
          ]),
        ),
        // Ensure 'other' strictly defaults to false unless explicitly true
        other: values.other === true,
        // Ensure 'monsterManualPotion' is preserved
        monsterManualPotion:
          typeof values.monsterManualPotion === 'boolean'
            ? values.monsterManualPotion
            : DEFAULT_ALLOWED_TYPES.monsterManualPotion,
      };
    }
    return { ...DEFAULT_ALLOWED_TYPES };
  });

  const [showUnchangedItems, setShowUnchangedItems] = useState<boolean>(() => {
    const saved = readPreference(PREFERENCE_KEYS.showUnchangedItems);
    if (saved !== null) return saved === 'true';
    return DEFAULT_SHOW_UNCHANGED_ITEMS;
  });

  const [foodQualityFilter, setFoodQualityFilter] = useState<FoodQualityFilter>(() => {
    const saved = readPreference(PREFERENCE_KEYS.foodQualityFilter);
    if (saved && VALID_FOOD_QUALITIES.has(saved)) return saved as FoodQualityFilter;
    return DEFAULT_FOOD_QUALITY_FILTER;
  });

  const [boozeQualityFilter, setBoozeQualityFilter] = useState<BoozeQualityFilter>(() => {
    return normalizeBoozeQualityFilter(readPreference(PREFERENCE_KEYS.boozeQualityFilter));
  });

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.allowedTags, JSON.stringify(allowedTags));
  }, [allowedTags]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.allowedTypes, JSON.stringify(allowedTypes));
  }, [allowedTypes]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.thriftyMode, thriftyMode);
  }, [thriftyMode]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.itemLayout, itemLayout);
  }, [itemLayout]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.showUnchangedItems, String(showUnchangedItems));
  }, [showUnchangedItems]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.foodQualityFilter, foodQualityFilter);
  }, [foodQualityFilter]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.boozeQualityFilter, boozeQualityFilter);
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
