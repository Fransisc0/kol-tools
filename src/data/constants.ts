import { ClassInfo, MoonSignInfo } from '../types';

export const CLASSES: ClassInfo[] = [
  {
    id: 'Seal_Clubber',
    name: 'Seal Clubber',
    stat: 'Muscle',
    description: 'Brutal melee fighter fueled by primal fury.',
    color: '#ef4444',
  },
  {
    id: 'Turtle_Tamer',
    name: 'Turtle Tamer',
    stat: 'Muscle',
    description: 'Stalwart armored tank bonded with mystical turtles.',
    color: '#f97316',
  },
  {
    id: 'Pastamancer',
    name: 'Pastamancer',
    stat: 'Mysticality',
    description: 'Master of arcane noodle sorcery and noodle thralls.',
    color: '#3b82f6',
  },
  {
    id: 'Sauceror',
    name: 'Sauceror',
    stat: 'Mysticality',
    description: 'Alchemical conjurer of searing and chilly sauces.',
    color: '#6366f1',
  },
  {
    id: 'Disco_Bandit',
    name: 'Disco Bandit',
    stat: 'Moxie',
    description: 'Suave rogue who dances around attacks and stabs with style.',
    color: '#10b981',
  },
  {
    id: 'Accordion_Thief',
    name: 'Accordion Thief',
    stat: 'Moxie',
    description: 'Musical trickster wielding buffs, songs, and pickpocketing.',
    color: '#14b8a6',
  },
];

export const MOON_SIGNS: MoonSignInfo[] = [
  // Degrassi Knoll (friendly)
  {
    id: 'Mongoose',
    name: 'The Mongoose',
    statGroup: 'Muscle',
    zodiacSymbol: '🦡',
    bonus: '+20% Physical Damage',
    areaAccess: 'Degrassi Knoll (friendly)',
  },
  {
    id: 'Wallaby',
    name: 'The Wallaby',
    statGroup: 'Mysticality',
    zodiacSymbol: '🦘',
    bonus: '+20% Spell Damage',
    areaAccess: 'Degrassi Knoll (friendly)',
  },
  {
    id: 'Vole',
    name: 'The Vole',
    statGroup: 'Moxie',
    zodiacSymbol: '🐀',
    bonus: '+20% Combat Initiative, +20 Maximum HP/MP',
    areaAccess: 'Degrassi Knoll (friendly)',
  },

  // Little Canadia
  {
    id: 'Platypus',
    name: 'The Platypus',
    statGroup: 'Muscle',
    zodiacSymbol: '🦆',
    bonus: 'Familiar Weight +5 lbs.',
    areaAccess: 'Little Canadia',
  },
  {
    id: 'Opossum',
    name: 'The Opossum',
    statGroup: 'Mysticality',
    zodiacSymbol: '🦝',
    bonus: '+5 Adventures per day from Food',
    areaAccess: 'Little Canadia',
  },
  {
    id: 'Marmot',
    name: 'The Marmot',
    statGroup: 'Moxie',
    zodiacSymbol: '🐿️',
    bonus: 'Slight Resistance to All Elements (+1)',
    areaAccess: 'Little Canadia',
  },

  // The Gnomish Gnomad Camp
  {
    id: 'Wombat',
    name: 'The Wombat',
    statGroup: 'Muscle',
    zodiacSymbol: '🐾',
    bonus: '+20% Meat from Monsters',
    areaAccess: 'The Gnomish Gnomad Camp',
  },
  {
    id: 'Blender',
    name: 'The Blender',
    statGroup: 'Mysticality',
    zodiacSymbol: '🍹',
    bonus: '+5 Adventures per day from Booze',
    areaAccess: 'The Gnomish Gnomad Camp',
  },
  {
    id: 'Packrat',
    name: 'The Packrat',
    statGroup: 'Moxie',
    zodiacSymbol: '📦',
    bonus: '+10% Items from Monsters',
    areaAccess: 'The Gnomish Gnomad Camp',
  },
];

// Exact class-moonsign combinations that have BOTH EPIC quality food and booze easily purchasable from an NPC store
export const EPIC_NPC_COMBINATIONS: Record<string, Record<string, { food: string; booze: string }>> = {
  Seal_Clubber: {
    Wallaby: { food: 'catsup (The Hermit)', booze: 'overpriced "imported" beer (Bart Ender)' },
    Platypus: { food: 'catsup (The Hermit)', booze: 'used beer (Huggler Memorial Colosseum Snack Bar)' },
    Opossum: { food: 'catsup (The Hermit)', booze: 'plain old beer (Bart Ender)' },
    Marmot: { food: 'ketchup (The Hermit)', booze: 'used beer (Huggler Memorial Colosseum Snack Bar)' },
    Packrat: { food: 'ketchup (The Hermit)', booze: 'cursed punch (The Hidden Tavern)' },
  },
  Turtle_Tamer: {
    Mongoose: { food: 'ketchup (The Hermit)', booze: "oreille divisée brandy (The Bounty Hunter Hunter's Shack)" },
    Wallaby: { food: 'cup of lukewarm tea (The General Store)', booze: 'day-old beer (Bart Ender)' },
    Platypus: { food: 'catsup (The Hermit)', booze: 'plain old beer (Bart Ender)' },
    Opossum: { food: 'catsup (The Hermit)', booze: "oreille divisée brandy (The Bounty Hunter Hunter's Shack)" },
    Packrat: { food: 'catsup (The Hermit)', booze: 'cursed punch (The Hidden Tavern)' },
  },
  Pastamancer: {
    Wombat: { food: 'catsup (The Hermit)', booze: 'bowl of scorpions (The Hidden Tavern)' },
    Blender: { food: 'ketchup (The Hermit)', booze: 'day-old beer (Bart Ender)' },
  },
  Sauceror: {
    Mongoose: { food: 'ketchup (The Hermit)', booze: "oreille divisée brandy (The Bounty Hunter Hunter's Shack)" },
    Platypus: { food: 'cup of lukewarm tea (The General Store)', booze: 'used beer (Huggler Memorial Colosseum Snack Bar)' },
  },
  Disco_Bandit: {
    Marmot: { food: 'ketchup (The Hermit)', booze: 'overpriced "imported" beer (Bart Ender)' },
    Blender: { food: 'ketchup (The Hermit)', booze: "oreille divisée brandy (The Bounty Hunter Hunter's Shack)" },
  },
  Accordion_Thief: {
    Opossum: { food: 'ketchup (The Hermit)', booze: 'day-old beer (Bart Ender)' },
    Blender: { food: 'cup of lukewarm tea (The General Store)', booze: 'day-old beer (Bart Ender)' },
    Packrat: { food: 'ketchup (The Hermit)', booze: 'day-old beer (Bart Ender)' },
  },
};

export function hasEpicNpcFoodAndBooze(classId: string, signId: string): boolean {
  return Boolean(EPIC_NPC_COMBINATIONS[classId]?.[signId]);
}

export function classHasAnyEpicNpcSign(classId: string): boolean {
  const signs = EPIC_NPC_COMBINATIONS[classId];
  return Boolean(signs && Object.keys(signs).length > 0);
}

export function getEpicNpcSignCount(classId: string): number {
  const signs = EPIC_NPC_COMBINATIONS[classId];
  return signs ? Object.keys(signs).length : 0;
}

