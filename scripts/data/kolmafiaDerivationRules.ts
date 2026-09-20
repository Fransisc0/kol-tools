import type { DerivationRules } from '../../src/features/tcrs/domain/derivationRules';

/** Resolve the exception lists from the reviewed KoLmafia derivation source. */

function constantsFrom(javaSource: string): ReadonlyMap<string, number> {
  const constants = new Map<string, number>();
  for (const match of javaSource.matchAll(/public static final int ([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\s*;/g)) {
    constants.set(match[1], Number(match[2]));
  }
  if (constants.size < 100) throw new Error('KoLmafia pool constants changed format.');
  return constants;
}

function resolve(constants: ReadonlyMap<string, number>, name: string): number {
  const value = constants.get(name);
  if (value === undefined) throw new Error(`Unknown KoLmafia pool constant: ${name}.`);
  return value;
}

function itemSet(source: string, constants: ReadonlyMap<string, number>, name: string): ReadonlySet<number> {
  const declaration = source.match(new RegExp(`\\b${name}\\s*=\\s*Set\\.of\\(([\\s\\S]*?)\\);`));
  if (!declaration) throw new Error(`Missing KoLmafia TCRS rule: ${name}.`);
  const values = new Set<number>();
  for (const match of declaration[1].matchAll(/ItemPool\.([A-Z][A-Z0-9_]*)/g)) {
    values.add(resolve(constants, match[1]));
  }
  if (!values.size) throw new Error(`Empty KoLmafia TCRS rule: ${name}.`);
  return values;
}

export function readDerivationRules(
  tcrsDatabaseJava: string,
  itemPoolJava: string,
  effectPoolJava: string,
): DerivationRules {
  const items = constantsFrom(itemPoolJava);
  const effects = constantsFrom(effectPoolJava);
  const overridesDeclaration = tcrsDatabaseJava.match(
    /\bHARDCODED_EFFECT_OVERRIDE\s*=\s*Map\.ofEntries\(([\s\S]*?)\);/,
  );
  if (!overridesDeclaration) throw new Error('Missing KoLmafia effect overrides.');
  const overrides = new Map<number, number>();
  for (const match of overridesDeclaration[1].matchAll(
    /Map\.entry\(ItemPool\.([A-Z][A-Z0-9_]*),\s*EffectPool\.([A-Z][A-Z0-9_]*)\)/g,
  )) {
    overrides.set(resolve(items, match[1]), resolve(effects, match[2]));
  }
  if (overrides.size !== 4) throw new Error('KoLmafia effect override rules changed.');

  return {
    notRerolled: itemSet(tcrsDatabaseJava, items, 'NOT_RE_ROLLED'),
    generic: itemSet(tcrsDatabaseJava, items, 'TCRS_GENERIC'),
    unalteredConsumables: itemSet(tcrsDatabaseJava, items, 'UNALTERED_CONSUMABLES'),
    zeroSizeConsumables: itemSet(tcrsDatabaseJava, items, 'ZERO_SIZE_CONSUMABLES'),
    zeroAdventureConsumables: itemSet(tcrsDatabaseJava, items, 'ZERO_ADVENTURE_CONSUMABLES'),
    hardcodedEffect: itemSet(tcrsDatabaseJava, items, 'HARDCODED_EFFECT'),
    hardcodedDynamicDuration: itemSet(tcrsDatabaseJava, items, 'HARDCODED_EFFECT_DYNAMIC_DURATION'),
    hardcodedEffectOverride: overrides,
    glitchItem: resolve(items, 'GLITCH_ITEM'),
  };
}
