import React from 'react';
import { TCRSItem, ItemTypeKey, FoodQualityFilter } from '../types';
import {
  Utensils,
  Wine,
  Sparkles,
  FlaskConical,
  Crown,
  Backpack,
  Shirt,
  Sword,
  Shield,
  Scissors,
  Gem,
  PawPrint,
} from 'lucide-react';
import { getMeaningfulItemModifiers, isFunctionallyUnchanged } from './itemSemantics';

export { getMeaningfulItemModifiers } from './itemSemantics';

/**
 * Resolves an item to its recognized canonical ItemTypeKey.
 * Back and container items are unified as 'container'.
 * Anything not matching recognized types maps to 'other'.
 */
export function getItemType(item: TCRSItem): ItemTypeKey {
  const pu = (item.primaryUse || '').toLowerCase().trim();
  if (pu === 'food') return 'food';
  if (pu === 'drink' || pu === 'booze') return 'booze';
  if (pu === 'spleen' || pu === 'chew') return 'spleen';
  if (item.isMonsterManualPotion || pu === 'avatar') return 'monsterManualPotion';
  if (item.isPotion || pu === 'potion') return 'potion';
  if (pu === 'hat') return 'hat';
  if (pu === 'container' || pu === 'back') return 'container';
  if (pu === 'shirt') return 'shirt';
  if (
    pu === 'weapon' ||
    pu.includes('weapon') ||
    pu === 'sixgun' ||
    pu.startsWith('1h') ||
    pu.startsWith('2h') ||
    pu === '1h' ||
    pu === '2h'
  ) {
    return 'weapon';
  }
  if (pu === 'offhand') return 'offhand';
  if (pu === 'pants') return 'pants';
  if (pu === 'accessory') return 'accessory';
  if (pu === 'familiar' || pu.includes('familiar')) return 'familiar';
  return 'other';
}

/**
 * Normalizes and strips structural/non-meaningful fields from modifiers.
 * Excludes:
 * - Effect: "..." / Effect: ...
 * - Effect Duration: \d+
 * - Familiar Effect: "..." / Familiar Effect: ...
 * - Last Available: "..." / Last Available: ...
 */
/**
 * Strips structural effect metadata (Effect: "...", Effect Duration: ...)
 * and non-essential metadata (Familiar Effect, Last Available) from itemModifiers,
 * preserving legitimate remaining item modifiers (e.g. Muscle: +10, Weapon Damage: +5).
 */
export function getNonEffectItemModifiers(item: TCRSItem): string {
  return getMeaningfulItemModifiers(item.itemModifiers);
}

/**
 * Determines whether an item was unchanged by TCRS.
 * An item is unchanged if:
 * 1. Its TCRS name matches the original name.
 * 2. It has no effect granted (no effectName, effectDuration, or effectModifiers).
 * 3. It has no TCRS stat bonus (size 0, empty quality, no extracted numeric bonus).
 * 4. It has NO meaningful remaining item modifiers (ignoring Familiar Effect and Last Available).
 */
export function isUnchangedItem(item: TCRSItem): boolean {
  return isFunctionallyUnchanged(item);
}

/**
 * Normalizes quality string for case-insensitive comparison.
 */
export function normalizeQuality(quality?: string): string {
  return (quality || '').toLowerCase().trim();
}

/**
 * Checks if quality is EPIC (including 'super EPIC', 'super ultra mega EPIC', etc.)
 */
export function isEpicQuality(quality?: string): boolean {
  const q = normalizeQuality(quality);
  return q.includes('epic');
}

/**
 * Checks if quality is AWESOME.
 */
export function isAwesomeQuality(quality?: string): boolean {
  const q = normalizeQuality(quality);
  return q === 'awesome';
}

/**
 * Validates food quality against current filter setting.
 * - 'awesome-plus': AWESOME or EPIC
 * - 'epic': EPIC only
 * - 'awesome': AWESOME only
 * - 'all': All food qualities
 */
export function isFoodQualityMatch(quality: string | undefined, filter: FoodQualityFilter): boolean {
  const isEpic = isEpicQuality(quality);
  const isAwesome = isAwesomeQuality(quality);

  switch (filter) {
    case 'epic':
      return isEpic;
    case 'awesome':
      return isAwesome;
    case 'awesome-plus':
      return isEpic || isAwesome;
    case 'all':
      return true;
    default:
      return isEpic || isAwesome;
  }
}

/**
 * Global booze quality rule: booze below EPIC quality is hidden by default.
 */
export function isBoozeQualityMatch(quality: string | undefined): boolean {
  return isEpicQuality(quality);
}

/**
 * Extracts friendly NPC Store location detail.
 */
export function getNpcStoreDetail(sourceDetails?: string[]): string | undefined {
  if (!sourceDetails || sourceDetails.length === 0) return undefined;
  const storeNames = [
    'General Store',
    'The Hermit',
    'The Armorer and Leggery',
    'The Hippy Store',
    'Huggler Memorial Colosseum',
    'The Black Market',
    'The Antique Store',
    'The Gift Shop',
  ];
  return sourceDetails.find((s) => storeNames.some((ns) => s.includes(ns)));
}

/**
 * Extracts friendly Crafting skill/source detail.
 */
export function getCraftDetail(sourceDetails?: string[]): string | undefined {
  if (!sourceDetails || sourceDetails.length === 0) return undefined;
  return sourceDetails.find(
    (s) => s.includes('Cocktail') || s.includes('Pasta') || s.includes('Sauce') || s.includes('Smith'),
  );
}

/**
 * Robust clipboard copy helper that returns a Promise<boolean>.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export interface TypeConfig {
  key: ItemTypeKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CONSUMABLE_TYPE_CONFIGS: TypeConfig[] = [
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'booze', label: 'Booze', icon: Wine },
  { key: 'spleen', label: 'Spleen', icon: Sparkles },
  { key: 'potion', label: 'Regular Potion', icon: FlaskConical },
  { key: 'monsterManualPotion', label: 'Avatar Potion', icon: FlaskConical },
];

export const EQUIPMENT_TYPE_CONFIGS: TypeConfig[] = [
  { key: 'hat', label: 'Hat', icon: Crown },
  { key: 'container', label: 'Back', icon: Backpack },
  { key: 'shirt', label: 'Shirt', icon: Shirt },
  { key: 'weapon', label: 'Weapon', icon: Sword },
  { key: 'offhand', label: 'Off-hand', icon: Shield },
  { key: 'pants', label: 'Pants', icon: Scissors },
  { key: 'accessory', label: 'Accessory', icon: Gem },
  { key: 'familiar', label: 'Familiar Equipment', icon: PawPrint },
];

export const ALL_TYPE_CONFIGS: TypeConfig[] = [...CONSUMABLE_TYPE_CONFIGS, ...EQUIPMENT_TYPE_CONFIGS];
