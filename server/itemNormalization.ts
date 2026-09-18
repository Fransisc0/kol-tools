import { TCRSItem } from '../src/types';
import { decodeHtmlEntities, isFunctionallyUnchanged } from '../src/utils/itemSemantics';

const EFFECT_PATTERN = /(?<!Familiar )Effect:\s*"([^"]+)"/;
const DURATION_PATTERN = /Effect Duration:\s*(\d+)/;
const EQUIPMENT_USES = new Set([
  'hat',
  'pants',
  'shirt',
  'weapon',
  'offhand',
  'accessory',
  'familiar',
  'container',
  'back',
  'sixgun',
]);

export interface ParsedEffect {
  effectName?: string;
  effectDuration?: number;
  effectModifiers: string;
}

export function parseEffectMetadata(
  itemModifiers: string,
  effectModifiersByName: ReadonlyMap<string, string>,
): ParsedEffect {
  const effectMatch = itemModifiers.match(EFFECT_PATTERN);
  const durationMatch = itemModifiers.match(DURATION_PATTERN);
  const rawEffectName = effectMatch?.[1];
  const effectName = rawEffectName ? decodeHtmlEntities(rawEffectName) : undefined;
  const effectDuration = durationMatch ? Number.parseInt(durationMatch[1], 10) : undefined;
  const effectKey = rawEffectName?.toLowerCase().trim();
  const effectModifiers = effectKey
    ? effectModifiersByName.get(effectKey) ||
      effectModifiersByName.get(effectKey.replace(/^\[\d+\]/, '').trim()) ||
      ''
    : '';

  return { effectName, effectDuration, effectModifiers };
}

export function isEquipmentUse(primaryUse: string): boolean {
  return EQUIPMENT_USES.has(primaryUse);
}

export function isPotionUse(primaryUse: string, originalUse: string, hasEffect: boolean): boolean {
  return (
    originalUse.includes('potion') ||
    ['potion', 'spleen', 'avatar'].includes(primaryUse) ||
    (hasEffect && !EQUIPMENT_USES.has(primaryUse))
  );
}

interface BaseItemInput {
  id: number;
  originalName: string;
  transformedName: string;
  size: number;
  quality: string;
  primaryUse: string;
  isPotion: boolean;
  isMonsterManualPotion: boolean;
  zones: string[];
  monsterManualInfo?: TCRSItem['monsterManualInfo'];
  isEquipment: boolean;
  isCafe: boolean;
  effect: ParsedEffect;
  itemModifiers: string;
  tags: TCRSItem['tags'];
  sourceDetails: string[];
}

export function createBaseItem(input: BaseItemInput): Omit<TCRSItem, 'extractedNumericBonus'> {
  const origName = decodeHtmlEntities(input.originalName);
  const tcrsName = decodeHtmlEntities(input.transformedName);
  const isUnchanged = isFunctionallyUnchanged({
    origName,
    tcrsName,
    itemModifiers: input.itemModifiers,
    effectName: input.effect.effectName,
    effectDuration: input.effect.effectDuration,
    effectModifiers: input.effect.effectModifiers,
    size: input.size,
    quality: input.quality,
  });

  return {
    id: input.id,
    origName,
    tcrsName,
    size: input.size,
    quality: input.quality,
    primaryUse: input.primaryUse,
    isPotion: input.isPotion,
    isMonsterManualPotion: input.isMonsterManualPotion,
    zones: input.zones.map(decodeHtmlEntities),
    monsterManualInfo: input.monsterManualInfo,
    isEquipment: input.isEquipment,
    isCafe: input.isCafe,
    isUnchanged,
    effectName: input.effect.effectName,
    effectDuration: input.effect.effectDuration,
    effectModifiers: input.effect.effectModifiers || undefined,
    itemModifiers: input.itemModifiers,
    tags: input.tags,
    sourceDetails: input.sourceDetails.map(decodeHtmlEntities),
  };
}
