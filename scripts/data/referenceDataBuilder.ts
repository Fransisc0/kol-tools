import fs from 'node:fs';
import path from 'node:path';
import { decodeLookupEntities } from '../../src/utils/itemSemantics';

export interface ItemMetadata {
  name: string;
  image: string;
  use: string;
}

export interface BuildReferenceData {
  items: Map<number, ItemMetadata>;
  effectModifiers: Map<string, string>;
  npcStores: Map<string, string[]>;
  craftMethods: Map<string, string[]>;
  thriftyWhitelist: Set<string>;
}

export function normalizeLookupName(value: string): string {
  return decodeLookupEntities(value.toLowerCase()).trim();
}

function addValue(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key) ?? [];
  if (!existing.includes(value)) existing.push(value);
  map.set(key, existing);
}

function loadItems(dataRoot: string, items: Map<number, ItemMetadata>): void {
  const filename = path.join(dataRoot, 'items.txt');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    const id = Number.parseInt(parts[0], 10);
    if (Number.isNaN(id)) continue;
    const rawUse = (parts[4] ?? '').trim().toLowerCase();
    items.set(id, {
      name: parts[1],
      image: parts[3],
      use: rawUse === 'container' ? 'back' : rawUse,
    });
  }
}

function loadCafeItems(dataRoot: string, items: Map<number, ItemMetadata>): void {
  for (const [relativePath, use] of [
    ['cafe_food.txt', 'food'],
    ['cafe_booze.txt', 'drink'],
  ] as const) {
    const filename = path.join(dataRoot, relativePath);
    if (!fs.existsSync(filename)) continue;
    for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
      if (line.startsWith('#') || !line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length < 2) continue;
      const id = Number.parseInt(parts[0], 10);
      if (!Number.isNaN(id)) items.set(id, { name: parts[1], image: '', use });
    }
  }
}

function loadEffectModifiers(dataRoot: string, effectModifiers: Map<string, string>): void {
  const filename = path.join(dataRoot, 'modifiers.txt');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (!line.startsWith('Effect\t')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const rawName = parts[1].toLowerCase().trim();
    effectModifiers.set(rawName, parts[2]);
    const cleanName = rawName.replace(/^\[\d+\]/, '').trim();
    if (!effectModifiers.has(cleanName) || parts[2].length > (effectModifiers.get(cleanName)?.length ?? 0)) {
      effectModifiers.set(cleanName, parts[2]);
    }
  }
}

function loadCoinmasterStores(dataRoot: string, npcStores: Map<string, string[]>): void {
  const filename = path.join(dataRoot, 'coinmasters.txt');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const master = parts[0].toLowerCase();
    const itemName = normalizeLookupName(parts[3]);
    let store = '';
    if (master.includes('shore, inc. gift shop')) store = 'The Shore, Inc. Gift Shop';
    else if (master.includes('bounty hunter hunter') && !master.includes('hms')) {
      store = "The Bounty Hunter Hunter's Shack";
    } else if (master.includes('swagger shop')) store = 'The Swagger Shop';
    if (store) addValue(npcStores, itemName, store);
  }
}

function loadNpcStores(dataRoot: string, npcStores: Map<string, string[]>): void {
  const filename = path.join(dataRoot, 'npcstores.txt');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const store = parts[0].trim();
    const storeLower = store.toLowerCase();
    if (
      storeLower.includes('black and white and red') ||
      storeLower.includes('crimbo') ||
      (parts[1] && parts[1].toLowerCase().includes('crimbo')) ||
      storeLower.includes('cyber_hackmarket') ||
      storeLower.includes('ornament stand')
    ) {
      continue;
    }

    const itemName = normalizeLookupName(parts[2]);
    const cleanedStore = store
      .replace(' (Pre-War)', '')
      .replace(' (Hippy)', '')
      .replace(' (Fratboy)', '')
      .replace(' (Bees Hate You)', '');
    if (cleanedStore === 'The Typical Tavern') addValue(npcStores, itemName, 'Bart Ender');
    else if (cleanedStore.includes('Hippy Store')) {
      addValue(npcStores, itemName, 'The Hippy Store');
      addValue(npcStores, itemName, 'The Organic Produce Stand');
    } else addValue(npcStores, itemName, cleanedStore);
  }

  const addSpecialVendor = (items: string[], store: string): void => {
    for (const item of items) addValue(npcStores, normalizeLookupName(item), store);
  };
  addSpecialVendor(
    [
      'ten-leaf clover',
      'seal tooth',
      'chisel',
      'pet rock',
      'jabañero pepper',
      'wooden figurine',
      'ketchup',
      'catsup',
      'chewing gum on a string',
      'worthless trinket',
      'worthless gewgaw',
      'worthless knick-knack',
    ],
    'The Hermit',
  );
  addSpecialVendor(['bottle of goofballs', 'goofballs'], 'A Suspicious-Looking Guy');
  addSpecialVendor(
    ['peche a la frog', 'as jus gezund heit', 'bouillabaise coucher avec moi'],
    'Chez Snootée',
  );
}

function loadCraftMethods(dataRoot: string, craftMethods: Map<string, string[]>): void {
  const filename = path.join(dataRoot, 'concoctions.txt');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t').map((value) => value.trim());
    if (parts.length < 3) continue;
    const itemName = normalizeLookupName(parts[0]);
    const method = parts[1].toUpperCase();
    const ingredients = parts.slice(2).map((value) => value.toLowerCase());
    const matches: string[] = [];
    if (method === 'ACOCK' || method === 'MIX, AC') matches.push('Advanced Cocktailcrafting');
    if (method === 'PASTA' || method === 'PASTAMASTERY') matches.push('Pastamastery');
    if (method === 'SAUCE' || method === 'SAUCE, SX3') matches.push('Advanced Saucecrafting');
    if (method === 'SMITH' || method.startsWith('SMITH,')) {
      const isTierTwo = ingredients.some(
        (ingredient) =>
          ingredient.includes('dry noodles') ||
          ingredient.includes('ketchup') ||
          ingredient.includes('catsup') ||
          ingredient.includes('scrumptious reagent'),
      );
      matches.push(`Basic Meatsmithing, Tier ${isTierTwo ? '2' : '1'}`);
    }
    for (const match of matches) addValue(craftMethods, itemName, match);
  }
}

function loadThriftyWhitelist(projectRoot: string, thriftyWhitelist: Set<string>): void {
  const filename = path.join(projectRoot, 'data/thrifty-whitelist.json');
  if (!fs.existsSync(filename)) return;
  try {
    const values = JSON.parse(fs.readFileSync(filename, 'utf8')) as string[];
    for (const value of values) thriftyWhitelist.add(normalizeLookupName(value));
  } catch {
    console.error(JSON.stringify({ level: 'error', event: 'thrifty_whitelist_parse_failed' }));
  }
}

export function loadReferenceData(
  dataRoot = path.join(process.cwd(), 'data', 'kolmafia'),
  projectRoot = process.cwd(),
): BuildReferenceData {
  const data: BuildReferenceData = {
    items: new Map(),
    effectModifiers: new Map(),
    npcStores: new Map(),
    craftMethods: new Map(),
    thriftyWhitelist: new Set(),
  };
  loadThriftyWhitelist(projectRoot, data.thriftyWhitelist);
  loadItems(dataRoot, data.items);
  loadCafeItems(dataRoot, data.items);
  loadEffectModifiers(dataRoot, data.effectModifiers);
  loadCoinmasterStores(dataRoot, data.npcStores);
  loadNpcStores(dataRoot, data.npcStores);
  loadCraftMethods(dataRoot, data.craftMethods);
  return data;
}
