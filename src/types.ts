export type StatType = 'Muscle' | 'Mysticality' | 'Moxie';

export interface ClassInfo {
  id: string;
  name: string;
  stat: StatType;
  description: string;
  color: string;
}

export interface MoonSignInfo {
  id: string;
  name: string;
  statGroup: StatType;
  zodiacSymbol: string;
  bonus: string;
  areaAccess: string;
}

export type ItemTagType =
  | 'NPC Store'
  | 'Craftable'
  | 'Easily Craftable Recipe'
  | 'Thrifty Accessible'
  | 'Non-Thrifty'
  | 'The Sea'
  | 'Drops / Other';

export type ThriftyMode = 'thrifty' | 'non-thrifty' | 'all';

export type FoodQualityFilter = 'awesome-plus' | 'epic' | 'awesome' | 'all';

export type ItemTypeKey =
  | 'food'
  | 'booze'
  | 'spleen'
  | 'potion'
  | 'monsterManualPotion'
  | 'hat'
  | 'container'
  | 'shirt'
  | 'weapon'
  | 'offhand'
  | 'pants'
  | 'accessory'
  | 'familiar'
  | 'other';

export const DEFAULT_ALLOWED_TYPES: Record<ItemTypeKey, boolean> = {
  food: true,
  booze: true,
  spleen: true,
  potion: true,
  monsterManualPotion: true,
  hat: true,
  container: true,
  shirt: true,
  weapon: true,
  offhand: true,
  pants: true,
  accessory: true,
  familiar: true,
  other: false,
};

export const DEFAULT_ALLOWED_TAGS = {
  'Thrifty Accessible': true,
  'Non-Thrifty': false,
  'NPC Store': true,
  Craftable: true,
  'Drops / Other': true,
  'The Sea': true,
} as const;

export const DEFAULT_THRIFTY_MODE: ThriftyMode = 'thrifty';
export const DEFAULT_FOOD_QUALITY_FILTER: FoodQualityFilter = 'awesome-plus';
export const DEFAULT_SHOW_UNCHANGED_ITEMS = false;

export interface TCRSItem {
  id: number;
  tcrsName: string;
  origName: string;
  size: number;
  quality: string;
  primaryUse: string;
  isPotion: boolean;
  isMonsterManualPotion?: boolean;
  zones?: string[];
  monsterManualInfo?: {
    monster: string;
    item: string;
    location: string;
  };
  isEquipment: boolean;
  isCafe: boolean;
  isUnchanged?: boolean;
  effectName?: string;
  effectDuration?: number;
  effectModifiers?: string;
  itemModifiers: string;
  extractedBonus?: string | number;
  extractedNumericBonus: number; // for automatic sorting from most to least
  extractedStat?: string;
  tags: ItemTagType[];
  sourceDetails: string[];
}

export interface TCRSDataResponse {
  className: string;
  moonSign: string;
  allItems: TCRSItem[];

  // -- Turn Generation --
  turnGeneration: {
    food: TCRSItem[];
    booze: TCRSItem[];
    rolloverAdventures: TCRSItem[];
    odeToBooze: TCRSItem[];
    garish: TCRSItem[];
  };

  // -- General Quest Buffs --
  generalQuestBuffs: {
    // Combat Frequency
    noncombat: TCRSItem[];
    combat: TCRSItem[];
    monsterLevel: TCRSItem[];
    // Item%
    normalItemDrop: TCRSItem[];
    foodDrop: TCRSItem[];
    boozeDrop: TCRSItem[];
    // Meat%
    meatDrop: TCRSItem[];
    // Stat Gains
    statGainsBasic: TCRSItem[];
    statGainsMus: TCRSItem[];
    statGainsMys: TCRSItem[];
    statGainsMox: TCRSItem[];
    // Familiar
    familiarWeight: TCRSItem[];
    familiarExp: TCRSItem[];
    // Initiative%
    initiative: TCRSItem[];
  };

  // -- Quest Specific Buffs --
  questSpecificBuffs: {
    // Smut Orcs & Combat
    minusMonsterLevel: TCRSItem[];
    frostyEffect: TCRSItem[];
    flatWeaponDamage: TCRSItem[];
    weaponDamagePercent: TCRSItem[];
    flatSpellDamage: TCRSItem[];
    spellDamagePercent: TCRSItem[];
    // Elemental Resistance
    resCold: TCRSItem[];
    resHot: TCRSItem[];
    resStench: TCRSItem[];
    resSpooky: TCRSItem[];
    resSleaze: TCRSItem[];
    // Elemental Dmg/Elemental Spell Dmg
    dmgCold: TCRSItem[];
    dmgHot: TCRSItem[];
    dmgStench: TCRSItem[];
    dmgSpooky: TCRSItem[];
    dmgSleaze: TCRSItem[];
  };

  // -- Survival Buffs --
  survivalBuffs: {
    // Special Buffs
    superSkill: TCRSItem[];
    odeToBooze: TCRSItem[];
    frosty: TCRSItem[];
    inigos: TCRSItem[];
    // Mainstat Buffs
    flatMuscle: TCRSItem[];
    musclePercent: TCRSItem[];
    flatMysticality: TCRSItem[];
    mysticalityPercent: TCRSItem[];
    flatMoxie: TCRSItem[];
    moxiePercent: TCRSItem[];
    // Damage Absorption
    damageAbsorption: TCRSItem[];
    // MP regeneration
    mpRegen: TCRSItem[];
  };

  summary: Record<string, number>;
}

export type MainSectionTab = 'turn-generation' | 'buffs';

export type SubCategoryKey =
  // Turn Gen
  | 'food'
  | 'booze'
  | 'rolloverAdventures'
  | 'odeToBooze'
  | 'garish'
  // General Quest Buffs
  | 'noncombat'
  | 'combat'
  | 'monsterLevel'
  | 'normalItemDrop'
  | 'foodDrop'
  | 'boozeDrop'
  | 'meatDrop'
  | 'statGainsBasic'
  | 'statGainsMus'
  | 'statGainsMys'
  | 'statGainsMox'
  | 'familiarWeight'
  | 'familiarExp'
  | 'initiative'
  // Quest Specific Buffs
  | 'minusMonsterLevel'
  | 'frostyEffect'
  | 'flatWeaponDamage'
  | 'weaponDamagePercent'
  | 'flatSpellDamage'
  | 'spellDamagePercent'
  | 'resCold'
  | 'resHot'
  | 'resStench'
  | 'resSpooky'
  | 'resSleaze'
  | 'dmgCold'
  | 'dmgHot'
  | 'dmgStench'
  | 'dmgSpooky'
  | 'dmgSleaze'
  // Survival Buffs (Special Buffs & Mainstats)
  | 'superSkill'
  | 'odeToBooze'
  | 'frosty'
  | 'inigos'
  | 'flatMuscle'
  | 'musclePercent'
  | 'flatMysticality'
  | 'mysticalityPercent'
  | 'flatMoxie'
  | 'moxiePercent'
  | 'damageAbsorption'
  | 'mpRegen';
