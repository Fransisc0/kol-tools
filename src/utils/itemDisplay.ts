import { TCRSItem } from '../types';
import { getNonEffectItemModifiers } from './itemUtils';

export interface ItemPrimaryResult {
  kind: 'effect' | 'stat';
  label: string;
  value?: string;
  duration?: number;
  effectModifiers?: EffectModifierToken[];
  modifierSummary?: string;
  accessibleText?: string;
}

export interface EffectModifierToken {
  label: string;
  value: string;
  raw: string;
}

export interface ItemDisplayModel {
  isNameUnchanged: boolean;
  primaryResult?: ItemPrimaryResult;
  effectModifiers: string;
  itemModifiers: string;
  sources: string[];
  hasDetails: boolean;
}

const REDUNDANT_CONSUMABLE_SUMMARY =
  /^(?:crappy|decent|good|awesome|epic)\s+(?:food|booze)\s*\(size\s*\d+\)$/i;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function repeatsNumericValue(label: string, value: string): boolean {
  const numericToken = /[+-]?\d+(?:\.\d+)?/;
  return label.match(numericToken)?.[0] === value.match(numericToken)?.[0];
}

export function parseEffectModifiers(modifiers?: string): EffectModifierToken[] {
  if (!modifiers) return [];

  return modifiers
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^Familiar Effect\s*:/i.test(part))
    .map((raw) => {
      const separator = raw.indexOf(':');
      if (separator < 0) return { label: raw, value: '', raw };
      return {
        label: raw.slice(0, separator).trim(),
        value: raw.slice(separator + 1).trim(),
        raw,
      };
    });
}

export function summarizeEffectModifiers(tokens: EffectModifierToken[], limit = 2): string {
  const visible = tokens.slice(0, limit).map(({ label, value }) => (value ? `${label} ${value}` : label));
  const remaining = tokens.length - visible.length;
  return [...visible, ...(remaining > 0 ? [`+${remaining} more`] : [])].join(' · ');
}

function removeDuplicateModifiers(itemModifiers: string, effectModifiers: string): string {
  if (!itemModifiers) return '';
  const effectParts = new Set(
    effectModifiers
      .split(',')
      .map((part) => normalize(part))
      .filter(Boolean),
  );

  return itemModifiers
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !effectParts.has(normalize(part)))
    .filter(
      (part, index, all) => all.findIndex((candidate) => normalize(candidate) === normalize(part)) === index,
    )
    .join(', ');
}

export function getItemDisplayModel(item: TCRSItem): ItemDisplayModel {
  const isNameUnchanged = normalize(item.origName) === normalize(item.tcrsName);
  const effectModifiers = (item.effectModifiers || '').trim();
  const itemModifiers = removeDuplicateModifiers(getNonEffectItemModifiers(item), effectModifiers);
  const sources = Array.from(
    new Set((item.sourceDetails || []).map((source) => source.trim()).filter(Boolean)),
  );

  let primaryResult: ItemPrimaryResult | undefined;
  if (item.effectName?.trim()) {
    const effectModifierTokens = parseEffectModifiers(effectModifiers);
    const modifierSummary = summarizeEffectModifiers(effectModifierTokens);
    const accessibleParts = [
      item.effectName.trim(),
      ...effectModifierTokens.map((token) => token.raw),
      item.effectDuration !== undefined ? `${item.effectDuration} turns` : '',
    ].filter(Boolean);
    primaryResult = {
      kind: 'effect',
      label: item.effectName.trim(),
      duration: item.effectDuration,
      effectModifiers: effectModifierTokens,
      modifierSummary,
      accessibleText: accessibleParts.join(', '),
    };
  } else if (
    item.extractedStat?.trim() &&
    !REDUNDANT_CONSUMABLE_SUMMARY.test(item.extractedStat.trim()) &&
    normalize(item.extractedStat) !== normalize(item.origName) &&
    normalize(item.extractedStat) !== normalize(item.tcrsName) &&
    !normalize(item.extractedStat).startsWith('familiar effect')
  ) {
    const extractedStat = item.extractedStat.trim();
    const structuralSummary = /(?:Familiar Effect|Wiki Name|Last Available)\s*:/i.test(extractedStat);
    const mirrorsRawModifiers = normalize(extractedStat) === normalize(item.itemModifiers || '');
    const label = structuralSummary || mirrorsRawModifiers ? itemModifiers : extractedStat;
    const bonus = item.extractedBonus === undefined ? '' : String(item.extractedBonus).trim();
    if (label) {
      primaryResult = {
        kind: 'stat',
        label,
        value:
          bonus && !normalize(label).includes(normalize(bonus)) && !repeatsNumericValue(label, bonus)
            ? bonus
            : undefined,
      };
    }
  }

  return {
    isNameUnchanged,
    primaryResult,
    effectModifiers,
    itemModifiers,
    sources,
    hasDetails: Boolean(effectModifiers || itemModifiers || sources.length),
  };
}
