import type { DerivationRules } from './derivationRules';
import {
  deriveEquipmentRolls,
  deriveFoodBoozeRolls,
  deriveGenericRolls,
  derivePotionRolls,
  deriveSpleenRolls,
  type BaseModifier,
  type EffectCandidate,
} from './derivationRolls';
import type { RollTables } from './rollTables';
import { decodeHtmlEntities } from '../../../utils/itemSemantics';

export interface DerivableItem {
  id: number;
  name: string;
  uses: readonly string[];
  modifiers: readonly BaseModifier[];
  stomach: number;
  liver: number;
  spleen: number;
  quality: string | null;
  adventures: number | null;
  notes: string;
}

export interface DerivedItem {
  name: string;
  size: number;
  quality: string;
  modifiers: string;
}

function formatQuality(quality: string | null): string {
  if (!quality || quality.toLowerCase() === 'none') return '';
  if (quality.toLowerCase() === 'changing') return '???';
  const normalized = quality.replaceAll('_', ' ');
  return normalized.toUpperCase().includes('EPIC')
    ? normalized.replace(/epic/i, 'EPIC')
    : normalized.toLowerCase();
}

function serializeModifiers(modifiers: readonly BaseModifier[]): string {
  return modifiers.map(({ name, value }) => (value === 'true' ? name : `${name}: ${value}`)).join(', ');
}

function retainedModifiers(
  modifiers: readonly BaseModifier[],
  enchantmentNames: ReadonlySet<string>,
): BaseModifier[] {
  return modifiers.filter(
    ({ name, value }) =>
      name !== 'Effect' &&
      name !== 'Effect Duration' &&
      name !== 'Enchantment Count' &&
      (!enchantmentNames.has(name.toLowerCase()) || value.includes('[')),
  );
}

function unalteredModifiers(modifiers: readonly BaseModifier[]): BaseModifier[] {
  return modifiers.filter(({ name }) => name !== 'Enchantment Count');
}

function unquote(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

function intrinsicEffect(modifiers: readonly BaseModifier[]): string | undefined {
  return unquote(modifiers.find(({ name }) => name === 'Effect')?.value);
}

function intrinsicDuration(modifiers: readonly BaseModifier[]): number | undefined {
  const raw = modifiers.find(({ name }) => name === 'Effect Duration')?.value;
  if (!raw) return undefined;
  const duration = Number(raw);
  return Number.isFinite(duration) ? duration : undefined;
}

function withEffect(
  modifiers: BaseModifier[],
  effect: string | undefined,
  duration: number | undefined,
): void {
  if (!effect) return;
  modifiers.push({ name: 'Effect', value: `"${effect}"` });
  if (duration !== undefined) modifiers.push({ name: 'Effect Duration', value: String(duration) });
}

function sizeFor(item: DerivableItem): number {
  if (item.uses.includes('food')) return item.stomach;
  if (item.uses.includes('drink')) return item.liver;
  if (item.uses.includes('spleen')) return item.spleen;
  return 0;
}

export interface DerivationContext {
  tables: RollTables;
  effects: readonly EffectCandidate[];
  effectPool: readonly EffectCandidate[];
  enchantmentNames: ReadonlySet<string>;
  rules: DerivationRules;
}

/** Apply the reviewed KoLmafia item routing and special cases to current source data. */
export function deriveItemRolls(
  item: DerivableItem,
  className: string,
  moonSign: string,
  context: DerivationContext,
): DerivedItem {
  const { tables, enchantmentNames, rules } = context;
  const effectPool = context.effectPool;
  const baseName = decodeHtmlEntities(item.name);
  const displayName = unquote(item.modifiers.find(({ name }) => name === 'Display Name')?.value);
  if (rules.notRerolled.has(item.id) || displayName) {
    return {
      name: displayName ?? baseName,
      size: sizeFor(item),
      quality: formatQuality(item.quality),
      modifiers: serializeModifiers(unalteredModifiers(item.modifiers)),
    };
  }

  const uses = item.id === rules.glitchItem ? [] : item.uses;
  if (uses.includes('potion') || uses.includes('avatar') || uses.includes('avatar potion')) {
    if (rules.generic.has(item.id)) {
      return {
        name: deriveGenericRolls(item.id, baseName, className, moonSign, tables, 6),
        size: 0,
        quality: '',
        modifiers: serializeModifiers(unalteredModifiers(item.modifiers)),
      };
    }
    const result = derivePotionRolls(item.id, baseName, className, moonSign, tables, effectPool);
    const modifiers = retainedModifiers(item.modifiers, enchantmentNames);
    withEffect(modifiers, result.effect, result.duration);
    return { name: result.name, size: 0, quality: '', modifiers: serializeModifiers(modifiers) };
  }

  if (uses.includes('food') || uses.includes('drink')) {
    if (rules.unalteredConsumables.has(item.id)) {
      const beverage = item.notes.split(',').some((note) => note.trim() === 'BEVERAGE');
      return {
        name: deriveGenericRolls(item.id, baseName, className, moonSign, tables, beverage ? 8 : 10),
        size: sizeFor(item),
        quality: formatQuality(item.quality),
        modifiers: serializeModifiers(retainedModifiers(item.modifiers, enchantmentNames)),
      };
    }
    const result = deriveFoodBoozeRolls(
      {
        id: item.id,
        name: baseName,
        isFood: uses.includes('food'),
        isBeverage: item.notes.split(',').some((note) => note.trim() === 'BEVERAGE'),
        baseAdventures: rules.zeroAdventureConsumables.has(item.id) ? 0 : (item.adventures ?? 0),
      },
      className,
      moonSign,
      tables,
      effectPool,
    );
    const modifiers = retainedModifiers(item.modifiers, enchantmentNames);
    let effect = result.effect;
    let duration = result.duration;
    if (rules.hardcodedEffect.has(item.id)) {
      const overrideId = rules.hardcodedEffectOverride.get(item.id);
      if (overrideId) {
        const override = context.effects.find(({ id }) => id === overrideId);
        if (!override) throw new Error('KoLmafia effect override is absent from current data.');
        effect = override.ambiguous ? `[${override.id}]${override.name}` : override.name;
      } else {
        effect = intrinsicEffect(item.modifiers);
      }
      if (!rules.hardcodedDynamicDuration.has(item.id)) {
        duration = intrinsicDuration(item.modifiers);
      } else if (!result.effect) {
        duration = undefined;
      }
    }
    withEffect(modifiers, effect, duration);
    return {
      name: result.name,
      size: rules.zeroSizeConsumables.has(item.id) ? 0 : result.size,
      quality: formatQuality(result.quality),
      modifiers: serializeModifiers(modifiers),
    };
  }

  if (uses.includes('spleen')) {
    const result = deriveSpleenRolls(item.id, baseName, className, moonSign, tables, effectPool);
    const modifiers = retainedModifiers(item.modifiers, enchantmentNames);
    withEffect(modifiers, result.effect, result.duration);
    return {
      name: result.name,
      size: result.size,
      quality: formatQuality(result.quality),
      modifiers: serializeModifiers(modifiers),
    };
  }

  if (
    uses.some((use) => ['hat', 'shirt', 'container', 'weapon', 'offhand', 'pants', 'accessory'].includes(use))
  ) {
    const result = deriveEquipmentRolls(
      item.id,
      baseName,
      item.modifiers,
      className,
      moonSign,
      tables,
      enchantmentNames,
    );
    const modifiers = retainedModifiers(item.modifiers, enchantmentNames);
    for (const selected of result.selectedModifiers) {
      for (const section of selected.split(',')) {
        const [name, value] = section.trim().split(/:\s*(.*)/s);
        if (!name) continue;
        const nextValue = value ?? 'true';
        const existingIndex = modifiers.findIndex((modifier) => modifier.name === name);
        if (existingIndex < 0) {
          modifiers.push({ name, value: nextValue });
        } else {
          const existingValue = modifiers[existingIndex].value;
          if (/^[+-]?\d+$/.test(existingValue) && /^[+-]?\d+$/.test(nextValue)) {
            modifiers.splice(existingIndex, 1);
            modifiers.push({ name, value: String(Number(existingValue) + Number(nextValue)) });
          }
        }
      }
    }
    return { name: result.name, size: 0, quality: '', modifiers: serializeModifiers(modifiers) };
  }

  return {
    name: deriveGenericRolls(item.id, baseName, className, moonSign, tables),
    size: sizeFor(item),
    quality: formatQuality(item.quality),
    modifiers: serializeModifiers(unalteredModifiers(item.modifiers)),
  };
}
