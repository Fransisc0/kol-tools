import { PHPMTRandom, PHPRandom, PHPRandomSelection } from './phpRandom';
import type { RollTables } from './rollTables';

export interface EffectCandidate {
  id: number;
  name: string;
  quality: string;
  noHookah: boolean;
  notTcrs: boolean;
  ambiguous: boolean;
}

export const CLASS_NUMERIC_IDS: Readonly<Record<string, number>> = {
  Seal_Clubber: 1,
  Turtle_Tamer: 2,
  Pastamancer: 3,
  Sauceror: 4,
  Disco_Bandit: 5,
  Accordion_Thief: 6,
};

export const SIGN_NUMERIC_IDS: Readonly<Record<string, number>> = {
  Mongoose: 1,
  Wallaby: 2,
  Vole: 3,
  Platypus: 4,
  Opossum: 5,
  Marmot: 6,
  Wombat: 7,
  Blender: 8,
  Packrat: 9,
};

export function seedFor(itemId: number, className: string, moonSign: string): number {
  const classId = CLASS_NUMERIC_IDS[className];
  const signId = SIGN_NUMERIC_IDS[moonSign];
  if (!Number.isSafeInteger(itemId) || classId === undefined || signId === undefined) {
    throw new Error('Unsupported TCRS item, class, or sign.');
  }
  return 50 * itemId + 12345 * signId + 100000 * classId;
}

function requireWords(tables: RollTables, category: string): readonly string[] {
  const values = tables.words.get(category);
  if (!values?.length) throw new Error(`Missing TCRS roll table: ${category}.`);
  return values;
}

export function removeAdjectives(name: string, tables: RollTables): string {
  return name
    .split(' ')
    .filter((word) => !tables.adjectives.has(word))
    .join(' ');
}

export function buildCosmeticList(random: PHPMTRandom, tables: RollTables, max: number): string[] {
  const cosmetics: string[] = [];
  if (random.nextInt(1, max) === 1) cosmetics.push(random.pickOne(requireWords(tables, 'Color'))!);
  let count = 0;
  for (let index = 0; index < 3; index += 1) {
    if (random.nextInt(1, max) === 1) count += 1;
  }
  for (let index = 0; index < count; index += 1) {
    cosmetics.push(random.pickOne(requireWords(tables, 'Cosmetic'))!);
  }
  return cosmetics;
}

export function rollCosmetics(
  mtRandom: PHPMTRandom,
  random: PHPRandom,
  tables: RollTables,
  max: number,
): string {
  const cosmetics = buildCosmeticList(mtRandom, tables, max);
  if (cosmetics.length) random.shuffle(cosmetics);
  cosmetics.reverse();
  return cosmetics.join(' ');
}

/** KoLmafia caps the ordered good-effect pool at Tiki Temerity, not at a hardcoded count. */
export function createEffectPool(effects: readonly EffectCandidate[]): readonly EffectCandidate[] {
  const tikiTemerity = effects.find((effect) => effect.name === 'Tiki Temerity');
  if (!tikiTemerity) throw new Error('TCRS effect cutoff is missing.');
  const pool = effects
    .filter(
      (effect) =>
        effect.id <= tikiTemerity.id &&
        effect.quality === 'good' &&
        (!effect.noHookah || effect.name === 'Fishy') &&
        !effect.notTcrs,
    )
    .sort((left, right) => left.id - right.id);
  if (!pool.length || pool.at(-1)?.id !== tikiTemerity.id) {
    throw new Error('TCRS effect pool is incomplete.');
  }
  return pool;
}

export function rollEffect(random: PHPMTRandom, pool: readonly EffectCandidate[]): string {
  if (!pool.length) throw new Error('Empty TCRS effect pool.');
  const effect = pool[Math.min(random.nextInt(0, pool.length), pool.length - 1)];
  return effect.ambiguous ? `[${effect.id}]${effect.name}` : effect.name;
}

export function derivePotionRolls(
  itemId: number,
  itemName: string,
  className: string,
  moonSign: string,
  tables: RollTables,
  effectPool: readonly EffectCandidate[],
): { name: string; effect: string; duration: number } {
  const seed = seedFor(itemId, className, moonSign);
  const mtRandom = new PHPMTRandom(seed);
  const random = new PHPRandom(seed);
  const cosmetics = rollCosmetics(mtRandom, random, tables, 6);
  const potionMods: string[] = [];
  let count = 1;
  if (mtRandom.nextInt(1, 3) === 1) count += 1;
  if (mtRandom.nextInt(1, 3) === 1) count += 1;
  for (let index = 0; index < count; index += 1) {
    potionMods.push(mtRandom.pickOne(requireWords(tables, 'Potion Mod'))!);
  }

  const effect = rollEffect(mtRandom, effectPool);
  const duration = mtRandom.nextInt(11, 69);
  const prefixes = requireWords(tables, 'Potion Prefix');
  const rendered: string[] = [];
  for (let mod of potionMods) {
    const prefixRoll = mtRandom.nextInt(1, 40);
    if (prefixRoll <= prefixes.length) mod = `${prefixes[prefixRoll - 1]}-${mod}`;
    rendered.unshift(mod);
  }
  const name = [rendered.join(' '), cosmetics, removeAdjectives(itemName, tables)].filter(Boolean).join(' ');
  return { name, effect, duration };
}

export interface ConsumableRollInput {
  id: number;
  name: string;
  isFood: boolean;
  isBeverage: boolean;
  baseAdventures: number;
}

function foodQuality(roll: number, beverage: boolean): string {
  return (
    [
      '',
      'CRAPPY',
      beverage ? 'DECENT' : 'CRAPPY',
      'DECENT',
      beverage ? 'GOOD' : 'DECENT',
      'GOOD',
      beverage ? 'AWESOME' : 'GOOD',
      beverage ? 'EPIC' : 'AWESOME',
    ][roll] ?? ''
  );
}

function boozeQuality(roll: number): string {
  return ['', 'DECENT', 'DECENT', 'GOOD', 'GOOD', 'AWESOME', 'EPIC', 'EPIC'][roll] ?? '';
}

function turnsPerFullness(quality: string): number {
  return { CRAPPY: 1, DECENT: 2, GOOD: 3, AWESOME: 4 }[quality] ?? (quality.includes('EPIC') ? 5 : 0);
}

function promoteEpic(quality: string, size: number, adventures: number): string {
  if (quality !== 'EPIC' || size <= 0) return quality;
  const ratio = adventures / size;
  if (ratio >= 11) return 'super_ultra_mega_turbo_EPIC';
  if (ratio >= 9.5) return 'super_ultra_mega_EPIC';
  if (ratio >= 8) return 'super_ultra_EPIC';
  if (ratio > 6.5) return 'super_EPIC';
  return quality;
}

function rollConsumableSize(random: PHPMTRandom): number {
  const roll = random.nextInt(1, 10);
  if (roll === 1) return 1;
  if (roll <= 3) return 2;
  if (roll <= 6) return 3;
  if (roll <= 8) return 4;
  if (roll === 9) return 5;
  return 5 + random.nextInt(1, 5);
}

function addSizeAndQualityAdjectives(
  adjectives: string[],
  random: PHPMTRandom,
  tables: RollTables,
  isFood: boolean,
  size: number,
  quality: string,
): void {
  const sizes = (isFood ? tables.foodSizes : tables.boozeSizes).get(Math.min(size, 6)) ?? [];
  if (sizes.length) adjectives.push(random.pickOne(sizes)!);
  const qualities = (isFood ? tables.foodQualities : tables.boozeQualities).get(quality);
  if (!qualities?.length) throw new Error(`Missing TCRS descriptor for ${quality}.`);
  adjectives.push(qualities.length > 1 ? random.pickOne(qualities)! : qualities[0]);
}

export function deriveFoodBoozeRolls(
  item: ConsumableRollInput,
  className: string,
  moonSign: string,
  tables: RollTables,
  effectPool: readonly EffectCandidate[],
): { name: string; size: number; quality: string; effect?: string; duration?: number } {
  const seed = seedFor(item.id, className, moonSign);
  const mtRandom = new PHPMTRandom(seed);
  const random = new PHPRandom(seed);
  const cosmetics = rollCosmetics(mtRandom, random, tables, item.isBeverage ? 8 : 10);
  const qualityRoll = mtRandom.nextInt(1, 7);
  const quality = item.isFood ? foodQuality(qualityRoll, item.isBeverage) : boozeQuality(qualityRoll);
  const size = item.isBeverage ? 1 : rollConsumableSize(mtRandom);
  const adjectives: string[] = [];

  if (!item.isBeverage) {
    addSizeAndQualityAdjectives(adjectives, mtRandom, tables, item.isFood, size, quality);
  }
  if (turnsPerFullness(quality) * size >= 8) mtRandom.nextDouble();

  const enchanted = mtRandom.nextInt(1, 10) === 1;
  if (enchanted) adjectives.push(mtRandom.pickOne(requireWords(tables, 'Food Enchantment'))!);
  const rolledEffect = rollEffect(mtRandom, effectPool);
  const rolledDuration = 5 * mtRandom.nextInt(1, 10);
  random.shuffle(adjectives);
  adjectives.reverse();
  const name = [...adjectives, cosmetics, removeAdjectives(item.name, tables)].filter(Boolean).join(' ');

  return {
    name,
    size,
    quality: promoteEpic(quality, size, item.baseAdventures),
    effect: enchanted ? rolledEffect : undefined,
    duration: enchanted ? rolledDuration : undefined,
  };
}

export interface BaseModifier {
  name: string;
  value: string;
}

const elementalDamage = ['Hot Damage', 'Cold Damage', 'Spooky Damage', 'Stench Damage', 'Sleaze Damage'];
const regenNames = [
  'HP Regen Min',
  'HP Regen Max',
  'MP Regen Min',
  'MP Regen Max',
  'HP / MP Regen Min',
  'HP / MP Regen Max',
];
const unsupportedFunctions = ['pref(', 'env(', 'zone(', 'effect(', 'class(', 'path('];

export function enchantmentCount(
  modifiers: readonly BaseModifier[],
  enchantmentNames: ReadonlySet<string>,
): number {
  const override = modifiers.find((modifier) => modifier.name === 'Enchantment Count');
  if (override) {
    const count = Number(override.value);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid enchantment count override.');
    return count;
  }

  const present = new Map<string, Set<string>>();
  for (const modifier of modifiers) {
    if (!enchantmentNames.has(modifier.name.toLowerCase())) continue;
    if (
      modifier.value.startsWith('[') &&
      unsupportedFunctions.some((term) => modifier.value.includes(term))
    ) {
      continue;
    }
    const values = present.get(modifier.name) ?? new Set<string>();
    values.add(modifier.value);
    present.set(modifier.name, values);
  }

  let count = 0;
  const consumed = new Set<string>();
  if (elementalDamage.every((name) => present.has(name))) {
    const values = new Set(elementalDamage.flatMap((name) => [...(present.get(name) ?? [])]));
    if (values.size === 1) {
      count += 1;
      for (const name of elementalDamage) consumed.add(name);
    }
  }
  const regenGroups = [regenNames.slice(0, 2), regenNames.slice(2, 4), regenNames.slice(4, 6)];
  for (const group of regenGroups) {
    if (group.some((name) => present.has(name))) count += 1;
  }
  for (const name of regenNames) consumed.add(name);
  for (const [name, values] of present) {
    if (!consumed.has(name)) count += values.size;
  }
  return count;
}

export function deriveEquipmentRolls(
  itemId: number,
  itemName: string,
  baseModifiers: readonly BaseModifier[],
  className: string,
  moonSign: string,
  tables: RollTables,
  enchantmentNames: ReadonlySet<string>,
): { name: string; count: number; selectedModifiers: string[] } {
  const seed = seedFor(itemId, className, moonSign);
  const cosmetics = buildCosmeticList(new PHPMTRandom(seed), tables, 8);
  const count = enchantmentCount(baseModifiers, enchantmentNames);
  const enchantRandom = new PHPRandom(seed + 10);
  const indices = new PHPRandomSelection(enchantRandom, new PHPMTRandom(seed + 10)).pick(
    tables.equipmentEnchantments.length,
    count,
  );
  const prefixes: string[] = [];
  const suffixes: string[] = [];
  const selectedModifiers: string[] = [];
  for (const index of indices) {
    const selected = tables.equipmentEnchantments[index];
    if (!selected) throw new Error('Invalid TCRS equipment enchantment index.');
    selectedModifiers.push(selected.modifier);
    if (selected.adjective.startsWith('of ')) suffixes.push(selected.adjective);
    else prefixes.unshift(selected.adjective);
  }
  const shuffleRandom = count === 0 ? new PHPRandom(seed) : enchantRandom;
  if (cosmetics.length) shuffleRandom.shuffle(cosmetics);
  cosmetics.reverse();
  const name = [
    cosmetics.join(' '),
    ...prefixes.filter((word) => !tables.adjectives.has(word)),
    removeAdjectives(itemName, tables),
    ...suffixes.filter((word) => !tables.adjectives.has(word)),
  ]
    .filter(Boolean)
    .join(' ');
  return { name, count, selectedModifiers };
}

export function deriveGenericRolls(
  itemId: number,
  itemName: string,
  className: string,
  moonSign: string,
  tables: RollTables,
  cosmeticChanceDenominator = 8,
): string {
  const seed = seedFor(itemId, className, moonSign);
  const cosmetics = rollCosmetics(
    new PHPMTRandom(seed),
    new PHPRandom(seed),
    tables,
    cosmeticChanceDenominator,
  );
  return [cosmetics, removeAdjectives(itemName, tables)].filter(Boolean).join(' ');
}

export function deriveSpleenRolls(
  itemId: number,
  itemName: string,
  className: string,
  moonSign: string,
  tables: RollTables,
  effectPool: readonly EffectCandidate[],
): { name: string; size: number; quality: string; effect?: string; duration?: number } {
  const seed = seedFor(itemId, className, moonSign);
  const mtRandom = new PHPMTRandom(seed);
  const random = new PHPRandom(seed);
  const cosmetics = rollCosmetics(mtRandom, random, tables, 4);
  const qualityRoll = mtRandom.nextInt(1, 7);
  const quality = ['', 'CRAPPY', 'DECENT', 'DECENT', 'GOOD', 'GOOD', 'AWESOME', 'EPIC'][qualityRoll];
  const adjective = mtRandom.pickOne(requireWords(tables, 'Spleen Mod'))!;
  if (quality === 'CRAPPY') {
    if (mtRandom.nextInt(1, 6) === 6) mtRandom.nextDouble();
  } else {
    mtRandom.nextDouble();
    mtRandom.nextDouble();
  }
  mtRandom.nextDouble();

  const enchanted = mtRandom.nextInt(1, 3) === 1;
  const effect = enchanted ? rollEffect(mtRandom, effectPool) : undefined;
  const duration = enchanted ? 5 * mtRandom.nextInt(1, 10) : undefined;
  return {
    name: [adjective, cosmetics, removeAdjectives(itemName, tables)].filter(Boolean).join(' '),
    size: 1,
    quality,
    effect,
    duration,
  };
}

export function deriveCafeRolls(
  itemId: number,
  baseName: string,
  isFood: boolean,
  baseAdventures: number,
  className: string,
  moonSign: string,
  tables: RollTables,
): { name: string; size: number; quality: string } {
  const seed = seedFor(itemId, className, moonSign);
  const mtRandom = new PHPMTRandom(seed);
  const random = new PHPRandom(seed);
  const cosmetics = rollCosmetics(mtRandom, random, tables, 10);
  const qualityRoll = mtRandom.nextInt(1, 7);
  const quality = isFood ? foodQuality(qualityRoll, false) : boozeQuality(qualityRoll);
  const size = rollConsumableSize(mtRandom);
  const adjectives: string[] = [];
  addSizeAndQualityAdjectives(adjectives, mtRandom, tables, isFood, size, quality);
  if (turnsPerFullness(quality) * size >= 8) mtRandom.nextDouble();
  if (mtRandom.nextInt(1, 10) === 1) {
    adjectives.push(mtRandom.pickOne(requireWords(tables, 'Food Enchantment'))!);
  }
  random.shuffle(adjectives);
  adjectives.reverse();
  return {
    name: [...adjectives, cosmetics, baseName].filter(Boolean).join(' '),
    size,
    quality: promoteEpic(quality, size, baseAdventures),
  };
}
