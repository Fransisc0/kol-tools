/** Ordered KoLmafia `tcrs.txt` tables. Their positions are part of the TCRS algorithm. */
export interface RollTables {
  words: ReadonlyMap<string, readonly string[]>;
  foodSizes: ReadonlyMap<number, readonly string[]>;
  boozeSizes: ReadonlyMap<number, readonly string[]>;
  foodQualities: ReadonlyMap<string, readonly string[]>;
  boozeQualities: ReadonlyMap<string, readonly string[]>;
  equipmentEnchantments: readonly { adjective: string; modifier: string }[];
  adjectives: ReadonlySet<string>;
}

function append<K>(map: Map<K, string[]>, key: K, value: string): void {
  const existing = map.get(key) ?? [];
  existing.push(value);
  map.set(key, existing);
}

export function parseRollTables(text: string): RollTables {
  const words = new Map<string, string[]>();
  const foodSizes = new Map<number, string[]>();
  const boozeSizes = new Map<number, string[]>();
  const foodQualities = new Map<string, string[]>();
  const boozeQualities = new Map<string, string[]>();
  const equipmentEnchantments: { adjective: string; modifier: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || /^\d+$/.test(line)) continue;
    const parts = line.split('\t');
    if (parts.length < 2) throw new Error('Malformed KoLmafia TCRS roll table.');
    const [category, key, value] = parts;
    switch (category) {
      case 'Food Size':
      case 'Booze Size': {
        const size = Number(key);
        if (!Number.isSafeInteger(size) || !value) throw new Error('Invalid TCRS size descriptor.');
        append(category === 'Food Size' ? foodSizes : boozeSizes, size, value);
        break;
      }
      case 'Food Quality':
      case 'Booze Quality':
        if (value === undefined) throw new Error('Invalid TCRS quality descriptor.');
        append(category === 'Food Quality' ? foodQualities : boozeQualities, key, value);
        break;
      case 'Equipment Enchant':
        if (!value) throw new Error('Invalid TCRS equipment enchantment.');
        equipmentEnchantments.push({ adjective: key, modifier: value });
        break;
      default:
        append(words, category, key);
    }
  }

  for (const required of ['Color', 'Cosmetic', 'Potion Mod', 'Potion Prefix', 'Food Enchantment']) {
    if (!words.get(required)?.length) throw new Error(`Missing TCRS roll table: ${required}.`);
  }
  if (!equipmentEnchantments.length) throw new Error('Missing TCRS equipment enchantments.');

  return {
    words,
    foodSizes,
    boozeSizes,
    foodQualities,
    boozeQualities,
    equipmentEnchantments,
    adjectives: new Set(words.get('Adjective') ?? []),
  };
}
