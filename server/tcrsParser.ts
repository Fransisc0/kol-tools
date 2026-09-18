import fs from 'fs';
import path from 'path';
import type { TCRSDataResponse, TCRSItem, ItemTagType } from '../src/types';
import { getMonsterManualEntry } from '../src/data/monsterManualData';
import { getItemZones } from './zoneData';
import { createBaseItem, isEquipmentUse, isPotionUse, parseEffectMetadata } from './itemNormalization';
import { createEmptyResponse } from './responseFactory';
import { TimedLruCache } from './timedLruCache';

interface ItemMeta {
  name: string;
  image: string;
  use: string;
}

let itemMap: Map<number, ItemMeta> | null = null;
let effectModsMap: Map<string, string> | null = null;

// Store & Craft classification maps
let npcStoreMap: Map<string, string[]> | null = null;
let craftMap: Map<string, string[]> | null = null;
let lastAvailableSet: Set<string> | null = null;
let mrStoreSet: Set<string> | null = null;
let itemMetaMap: Map<string, { id: number; access: string; price: number }> | null = null;
let thriftyWhitelistSet: Set<string> | null = null;

const hermitItemSet = new Set([
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
]);

const CACHE_TTL_MS = 10 * 60 * 1000;
const responseCache = new TimedLruCache<TCRSDataResponse>(6, CACHE_TTL_MS);
const inFlightResponses = new Map<string, Promise<TCRSDataResponse>>();

function getProjectRoot(): string {
  return process.cwd();
}

function cleanItemName(str: string): string {
  return str
    .toLowerCase()
    .replace(/&trade;/g, '™')
    .replace(/&trade/g, '™')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/&#39;/g, "'")
    .trim();
}

export function loadReferenceData(): void {
  if (
    itemMap &&
    effectModsMap &&
    npcStoreMap &&
    craftMap &&
    lastAvailableSet &&
    mrStoreSet &&
    itemMetaMap &&
    thriftyWhitelistSet
  )
    return;

  const root = getProjectRoot();
  itemMap = new Map<number, ItemMeta>();
  effectModsMap = new Map<string, string>();
  npcStoreMap = new Map<string, string[]>();
  craftMap = new Map<string, string[]>();
  lastAvailableSet = new Set<string>();
  mrStoreSet = new Set<string>();
  itemMetaMap = new Map<string, { id: number; access: string; price: number }>();
  thriftyWhitelistSet = new Set<string>();

  // 0. Load Thrifty Whitelist
  const whitelistFile = path.join(root, 'server/thriftyWhitelist.json');
  if (fs.existsSync(whitelistFile)) {
    try {
      const list: string[] = JSON.parse(fs.readFileSync(whitelistFile, 'utf-8'));
      for (const s of list) {
        thriftyWhitelistSet.add(cleanItemName(s));
      }
    } catch (e) {
      console.error('Failed to parse thriftyWhitelist.json:', e);
    }
  }

  // 1. Load items.txt
  const itemsFile = path.join(root, 'data/kolmafia/items.txt');
  if (fs.existsSync(itemsFile)) {
    const lines = fs.readFileSync(itemsFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t');
      if (p.length >= 5) {
        const id = parseInt(p[0], 10);
        if (!isNaN(id)) {
          const rawName = p[1];
          const cName = cleanItemName(rawName);
          const rawUse = (p[4] || '').trim().toLowerCase();
          const use = rawUse === 'container' ? 'back' : rawUse;
          itemMap.set(id, {
            name: rawName,
            image: p[3],
            use,
          });
          const access = p[5] || '';
          const price = p[6] ? parseInt(p[6], 10) || 0 : 0;
          itemMetaMap.set(cName, { id, access, price });
        }
      }
    }
  }

  // 2. Load cafe_food.txt & cafe_booze.txt
  const cafeFoodFile = path.join(root, 'data/kolmafia/cafe_food.txt');
  if (fs.existsSync(cafeFoodFile)) {
    const lines = fs.readFileSync(cafeFoodFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t');
      if (p.length >= 2) {
        const id = parseInt(p[0], 10);
        if (!isNaN(id)) {
          itemMap.set(id, {
            name: p[1],
            image: '',
            use: 'food',
          });
        }
      }
    }
  }

  const cafeBoozeFile = path.join(root, 'data/kolmafia/cafe_booze.txt');
  if (fs.existsSync(cafeBoozeFile)) {
    const lines = fs.readFileSync(cafeBoozeFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t');
      if (p.length >= 2) {
        const id = parseInt(p[0], 10);
        if (!isNaN(id)) {
          itemMap.set(id, {
            name: p[1],
            image: '',
            use: 'drink',
          });
        }
      }
    }
  }

  // 3. Load modifiers.txt (for effect mods AND Last Available limited items)
  const modsFile = path.join(root, 'data/kolmafia/modifiers.txt');
  if (fs.existsSync(modsFile)) {
    const lines = fs.readFileSync(modsFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('Effect\t')) {
        const p = line.split('\t');
        if (p.length >= 3) {
          const raw = p[1].toLowerCase().trim();
          effectModsMap.set(raw, p[2]);
          const clean = raw.replace(/^\[\d+\]/, '').trim();
          if (!effectModsMap.has(clean) || p[2].length > (effectModsMap.get(clean)?.length || 0)) {
            effectModsMap.set(clean, p[2]);
          }
        }
      } else if (line.startsWith('Item\t') && line.includes('Last Available:')) {
        const p = line.split('\t');
        if (p.length >= 2) {
          lastAvailableSet.add(cleanItemName(p[1]));
        }
      }
    }
  }

  // 4. Load Coinmasters for Mr. Store / IotM items and NPC stores
  const cmFile = path.join(root, 'data/kolmafia/coinmasters.txt');
  if (fs.existsSync(cmFile)) {
    const lines = fs.readFileSync(cmFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t');
      if (p.length >= 4) {
        const master = p[0].toLowerCase();
        const itemName = cleanItemName(p[3]);
        if (master.includes('mr. store') || master.includes('swagger') || master.includes('bounty hunter')) {
          mrStoreSet.add(itemName);
        }

        // User NPC Store whitelist entries from coinmasters:
        // - The Shore, Inc. Gift Shop
        // - The Bounty Hunter Hunter's Shack
        // - The Swagger Shop
        let matchedCmStore = '';
        if (master.includes('shore, inc. gift shop')) {
          matchedCmStore = 'The Shore, Inc. Gift Shop';
        } else if (master.includes('bounty hunter hunter') && !master.includes('hms')) {
          matchedCmStore = "The Bounty Hunter Hunter's Shack";
        } else if (master.includes('swagger shop')) {
          matchedCmStore = 'The Swagger Shop';
        }

        if (matchedCmStore) {
          const existing = npcStoreMap.get(itemName) || [];
          if (!existing.includes(matchedCmStore)) {
            existing.push(matchedCmStore);
          }
          npcStoreMap.set(itemName, existing);
        }
      }
    }
  }

  // 5. Load NPC Stores from npcstores.txt according to user whitelist
  const npcFile = path.join(root, 'data/kolmafia/npcstores.txt');
  if (fs.existsSync(npcFile)) {
    const lines = fs.readFileSync(npcFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t');
      if (p.length >= 3) {
        const store = p[0].trim();
        const itemName = cleanItemName(p[2]);
        const sl = store.toLowerCase();

        // Do not include temporary event/holiday stores like Black and White and Red All Over Market or Crimbo
        if (
          sl.includes('black and white and red') ||
          sl.includes('crimbo') ||
          (p[1] && p[1].toLowerCase().includes('crimbo')) ||
          sl.includes('cyber_hackmarket') ||
          sl.includes('ornament stand')
        ) {
          continue;
        }

        const addStore = (storeName: string) => {
          const existing = npcStoreMap!.get(itemName) || [];
          if (!existing.includes(storeName)) {
            existing.push(storeName);
          }
          npcStoreMap!.set(itemName, existing);
        };

        let finalStoreName = store;

        // Clean up some extraneous text
        finalStoreName = finalStoreName
          .replace(' (Pre-War)', '')
          .replace(' (Hippy)', '')
          .replace(' (Fratboy)', '')
          .replace(' (Bees Hate You)', '');

        if (finalStoreName === 'The Typical Tavern') {
          addStore('Bart Ender');
        } else if (finalStoreName.includes('Hippy Store')) {
          addStore('The Hippy Store');
          addStore('The Organic Produce Stand');
        } else {
          addStore(finalStoreName);
        }
      }
    }
  }

  // Hermit, Bart Ender, Suspicious Guy, Chez Snootée additions
  const addSpecialVendor = (item: string, storeName: string) => {
    const c = cleanItemName(item);
    const existing = npcStoreMap!.get(c) || [];
    if (!existing.includes(storeName)) {
      existing.push(storeName);
    }
    npcStoreMap!.set(c, existing);
  };

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
  ].forEach((i) => addSpecialVendor(i, 'The Hermit'));

  ['bottle of goofballs', 'goofballs'].forEach((i) => addSpecialVendor(i, 'A Suspicious-Looking Guy'));

  ['peche a la frog', 'as jus gezund heit', 'bouillabaise coucher avec moi'].forEach((i) =>
    addSpecialVendor(i, 'Chez Snootée'),
  );

  // 6. Load Concoctions from concoctions.txt
  // Exact method parsing based on official KoLmafia concoction definitions:
  // - Advanced Cocktailcrafting: ACOCK or 'MIX, AC' (NOT SACOCK which is Salacious Cocktailcrafting)
  // - Pastamastery: PASTA or PASTAMASTERY (NOT TNOODLE)
  // - Advanced Saucecrafting: SAUCE or 'SAUCE, SX3' (NOT DSAUCE, SSAUCE)
  // - Basic Meatsmithing: SMITH or starts with 'SMITH,' (NOT ASMITH or WSMITH)
  const concFile = path.join(root, 'data/kolmafia/concoctions.txt');
  if (fs.existsSync(concFile)) {
    const lines = fs.readFileSync(concFile, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const p = line.split('\t').map((x) => x.trim());
      if (p.length >= 3) {
        const itemName = cleanItemName(p[0]);
        const methodUpper = p[1].toUpperCase();
        const ingrs = p.slice(2).map((x) => x.toLowerCase());

        const matchedCrafts: string[] = [];

        // 1. Advanced Cocktailcrafting
        if (methodUpper === 'ACOCK' || methodUpper === 'MIX, AC') {
          matchedCrafts.push('Advanced Cocktailcrafting');
        }

        // 2. Pastamastery
        if (methodUpper === 'PASTA' || methodUpper === 'PASTAMASTERY') {
          matchedCrafts.push('Pastamastery');
        }

        // 3. Advanced Saucecrafting
        if (methodUpper === 'SAUCE' || methodUpper === 'SAUCE, SX3') {
          matchedCrafts.push('Advanced Saucecrafting');
        }

        // 4. Basic Meatsmithing
        if (methodUpper === 'SMITH' || methodUpper.startsWith('SMITH,')) {
          if (
            ingrs.some(
              (i) =>
                i.includes('dry noodles') ||
                i.includes('ketchup') ||
                i.includes('catsup') ||
                i.includes('scrumptious reagent'),
            )
          ) {
            matchedCrafts.push('Basic Meatsmithing, Tier 2');
          } else {
            matchedCrafts.push('Basic Meatsmithing, Tier 1');
          }
        }

        if (matchedCrafts.length > 0) {
          const existing = craftMap.get(itemName) || [];
          for (const mc of matchedCrafts) {
            if (!existing.includes(mc)) existing.push(mc);
          }
          craftMap.set(itemName, existing);
        }
      }
    }
  }
}

// Determines if an item belongs on the Thrifty whitelist or is Non-Thrifty
function isThriftyAccessible(
  origName: string,
  _id: number,
  _itemModifiers: string,
): { isThrifty: boolean; reason: string } {
  const clean = cleanItemName(origName);

  if (thriftyWhitelistSet && thriftyWhitelistSet.has(clean)) {
    return { isThrifty: true, reason: 'Thrifty Whitelist' };
  }

  return { isThrifty: false, reason: 'Non-Thrifty (Not in Whitelist)' };
}

// Determines tags and source details for an item
function getItemTags(
  origName: string,
  id: number,
  itemModifiers: string = '',
): { tags: ItemTagType[]; sourceDetails: string[] } {
  const clean = cleanItemName(origName);
  const tags: ItemTagType[] = [];
  const sourceDetails: string[] = [];

  const { isThrifty, reason } = isThriftyAccessible(origName, id, itemModifiers);

  if (isThrifty) {
    tags.push('Thrifty Accessible');
  } else {
    tags.push('Non-Thrifty');
    sourceDetails.push(reason);
  }

  // Check NPC Stores
  const stores = npcStoreMap?.get(clean) || [];
  if (stores.length > 0) {
    if (!tags.includes('NPC Store')) tags.push('NPC Store');
    for (const st of stores) {
      if (!sourceDetails.includes(st)) sourceDetails.push(st);
    }
  }
  if (hermitItemSet.has(clean)) {
    if (!tags.includes('NPC Store')) tags.push('NPC Store');
    if (!sourceDetails.includes('The Hermit')) sourceDetails.push('The Hermit');
  }

  // Check Craftable Recipes
  const crafts = craftMap?.get(clean) || [];
  if (crafts.length > 0) {
    if (!tags.includes('Craftable')) tags.push('Craftable');
    if (!tags.includes('Easily Craftable Recipe')) tags.push('Easily Craftable Recipe');
    for (const cr of crafts) {
      if (!sourceDetails.includes(cr)) sourceDetails.push(cr);
    }
  }

  if (sourceDetails.length === 0) {
    sourceDetails.push(isThrifty ? 'In-run Drop / Evergreen Standard' : 'Non-Thrifty');
  }

  return { tags, sourceDetails };
}

// Helper to automatically sort items from most to least of their effect
function sortByMostToLeast(items: TCRSItem[]): TCRSItem[] {
  return items.sort((a, b) => b.extractedNumericBonus - a.extractedNumericBonus);
}

const githubFileCache = new TimedLruCache<string>(18, CACHE_TTL_MS);

async function getTCRSFileContent(filename: string): Promise<string | null> {
  const root = getProjectRoot();
  const localFile = path.join(root, 'data/kolmafia/tcrs', filename);

  const cached = githubFileCache.get(filename);
  if (cached) return cached;

  if (process.env.TCRS_OFFLINE !== 'true') {
    const githubUrl = `https://raw.githubusercontent.com/kolmafia/kolmafia/main/data/TCRS/${filename}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(githubUrl, { signal: controller.signal });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 50) {
          githubFileCache.set(filename, text);
          return text;
        }
      }
    } catch {
      // The bundled dataset below keeps the service available when upstream is unavailable.
    } finally {
      clearTimeout(timeout);
    }
  }

  // Fallback to local file
  if (fs.existsSync(localFile)) {
    try {
      const content = fs.readFileSync(localFile, 'utf-8');
      githubFileCache.set(filename, content);
      return content;
    } catch (e) {
      console.error(`Error reading local TCRS file ${localFile}:`, e);
    }
  }

  return null;
}

async function parseTCRSFileUncached(className: string, moonSign: string): Promise<TCRSDataResponse> {
  const normClass = className.replace(/\s+/g, '_');
  const normSign = moonSign.replace(/\s+/g, '_');

  loadReferenceData();

  const response = createEmptyResponse(normClass, normSign);

  const filesToRead = [
    {
      filename: `TCRS_${normClass}_${normSign}.txt`,
      isCafe: false,
      forcedType: '',
    },
    {
      filename: `TCRS_${normClass}_${normSign}_cafe_food.txt`,
      isCafe: true,
      forcedType: 'food',
    },
    {
      filename: `TCRS_${normClass}_${normSign}_cafe_booze.txt`,
      isCafe: true,
      forcedType: 'drink',
    },
  ];

  const seenAllItemIds = new Set<number>();

  for (const { filename, isCafe, forcedType } of filesToRead) {
    const content = await getTCRSFileContent(filename);
    if (!content) continue;
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length < 5) continue;

      const id = parseInt(parts[0], 10);
      const tcrsName = parts[1];
      const size = parseInt(parts[2], 10) || 0;
      const quality = parts[3];
      const itemModifiers = parts[4] || '';

      const origMeta = itemMap?.get(id) || {
        name: tcrsName,
        image: '',
        use: forcedType || 'none',
      };

      const primaryUse = (forcedType || origMeta.use.split(',')[0].trim()).toLowerCase();

      const effect = parseEffectMetadata(itemModifiers, effectModsMap || new Map());
      const { effectName, effectDuration, effectModifiers } = effect;
      const isPotion = isPotionUse(primaryUse, origMeta.use, Boolean(effectName));
      const isEquipment = isEquipmentUse(primaryUse);

      const itemZones = getItemZones(origMeta.name);

      const { tags, sourceDetails } = getItemTags(origMeta.name, id, itemModifiers);

      let isSeaItem = false;
      for (const z of itemZones) {
        const zl = z.toLowerCase();
        if (
          zl.includes('octopus') ||
          zl.includes('edgar fitz') ||
          zl.includes('marinara') ||
          zl.includes('dive bar') ||
          zl.includes('mer-kin') ||
          zl.includes('coral corral') ||
          zl.includes('caliginous') ||
          zl.includes('briny deep') ||
          zl.includes('h. m. s. kringle') ||
          zl.includes('ice hole') ||
          zl.includes('sea floor') ||
          zl.includes('madness reef') ||
          zl.includes('skate park')
        ) {
          isSeaItem = true;
        }
      }
      if (isSeaItem) {
        tags.push('The Sea' as any);
      }

      let isMonsterManualPotion = false;
      let monsterManualInfo: { monster: string; item: string; location: string } | undefined = undefined;

      if (isPotion) {
        const mmEntry = getMonsterManualEntry(origMeta.name) || getMonsterManualEntry(tcrsName);
        if (mmEntry) {
          isMonsterManualPotion = true;
          monsterManualInfo = mmEntry;
        }
      }

      const baseItem = createBaseItem({
        id,
        transformedName: tcrsName,
        originalName: origMeta.name,
        size,
        quality,
        primaryUse,
        isPotion,
        isMonsterManualPotion,
        zones: itemZones,
        monsterManualInfo,
        isEquipment,
        isCafe,
        effect,
        itemModifiers,
        tags,
        sourceDetails,
      });

      const combined = `${itemModifiers}, ${effectModifiers}`.replace(/^,\s*/, '').replace(/,\s*$/, '');

      // Add to allItems if not already present
      if (!seenAllItemIds.has(id)) {
        seenAllItemIds.add(id);
        response.allItems.push({
          ...baseItem,
          extractedNumericBonus: 0,
          extractedStat: combined || origMeta.name,
        });
      }

      // ==========================================
      // 1. -- Turn Generation --
      // ==========================================
      // Food (include EPIC and Awesome quality)
      const qLower = quality.toLowerCase().trim();
      if ((qLower === 'epic' || qLower === 'awesome') && (primaryUse === 'food' || forcedType === 'food')) {
        const isEpic = qLower === 'epic';
        response.turnGeneration.food.push({
          ...baseItem,
          // Sort EPIC foods (1000 + size) before Awesome foods (size)
          extractedNumericBonus: isEpic ? 1000 + size : size,
          extractedBonus: isEpic ? `EPIC (Size ${size})` : `Awesome (Size ${size})`,
          extractedStat: `${isEpic ? 'EPIC' : 'Awesome'} Food (Size ${size})`,
        });
      }

      // Booze (only include EPIC quality)
      if (quality === 'EPIC' && (primaryUse === 'drink' || forcedType === 'drink')) {
        response.turnGeneration.booze.push({
          ...baseItem,
          extractedNumericBonus: size,
          extractedBonus: `Size ${size}`,
          extractedStat: `EPIC Booze (Size ${size})`,
        });
      }

      // Rollover Adventures
      const advMatch = combined.match(/Adventures:\s*([+-]?\d+)/i);
      if (advMatch) {
        const bonus = parseInt(advMatch[1], 10);
        if (bonus > 0) {
          response.turnGeneration.rolloverAdventures.push({
            ...baseItem,
            extractedNumericBonus: bonus,
            extractedBonus: `+${bonus}`,
            extractedStat: `+${bonus} Rollover Adventures`,
          });
        }
      }

      // ==========================================
      // 2. -- General Quest Buffs --
      // ==========================================
      // Combat Frequency: Noncombat & Combat
      const combatRateMatch = combined.match(/Combat Rate:\s*([+-]?\d+)/i);
      if (combatRateMatch) {
        const rate = parseInt(combatRateMatch[1], 10);
        if (rate < 0) {
          // Noncombat (-combat) -> Higher magnitude is better
          response.generalQuestBuffs.noncombat.push({
            ...baseItem,
            extractedNumericBonus: Math.abs(rate),
            extractedBonus: `${rate}%`,
            extractedStat: `${rate}% Noncombat Frequency`,
          });
        } else if (rate > 0) {
          // Combat (+combat)
          response.generalQuestBuffs.combat.push({
            ...baseItem,
            extractedNumericBonus: rate,
            extractedBonus: `+${rate}%`,
            extractedStat: `+${rate}% Combat Frequency`,
          });
        }
      }

      // Item% Drops
      // Normal +item% drops
      const itemDropMatch = combined.match(/(?:Item Drop|Item Drop Percent):\s*([+-]?\d+)/i);
      if (itemDropMatch) {
        const bonus = parseInt(itemDropMatch[1], 10);
        response.generalQuestBuffs.normalItemDrop.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Item Drop`,
        });
      }

      // +food% drops
      const foodDropMatch = combined.match(/Food Drop:\s*([+-]?\d+)/i);
      if (foodDropMatch) {
        const bonus = parseInt(foodDropMatch[1], 10);
        response.generalQuestBuffs.foodDrop.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Food Drop`,
        });
      }

      // +booze% drops
      const boozeDropMatch = combined.match(/Booze Drop:\s*([+-]?\d+)/i);
      if (boozeDropMatch) {
        const bonus = parseInt(boozeDropMatch[1], 10);
        response.generalQuestBuffs.boozeDrop.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Booze Drop`,
        });
      }

      // Meat%
      const meatDropMatch = combined.match(/(?:Meat Drop|Meat Drop Percent):\s*([+-]?\d+)/i);
      if (meatDropMatch) {
        const bonus = parseInt(meatDropMatch[1], 10);
        response.generalQuestBuffs.meatDrop.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Meat Drop`,
        });
      }

      // Stat Gains
      // Basic + stat gains/fight
      const expMatch = combined.match(/(?<!(?:Muscle|Mysticality|Moxie) )Experience:\s*([+-]?\d+)/i);
      const expPctMatch = combined.match(
        /(?<!(?:Muscle|Mysticality|Moxie) )Experience Percent:\s*([+-]?\d+)/i,
      );
      if (expMatch || expPctMatch) {
        const val = expMatch ? parseInt(expMatch[1], 10) : parseInt(expPctMatch![1], 10);
        const suffix = expPctMatch ? '%' : '';
        response.generalQuestBuffs.statGainsBasic.push({
          ...baseItem,
          extractedNumericBonus: val,
          extractedBonus: `${val > 0 ? '+' : ''}${val}${suffix}`,
          extractedStat: `${val > 0 ? '+' : ''}${val}${suffix} All Stats/Fight`,
        });
      }

      // +mus% gains
      const musExpMatch = combined.match(/Muscle Experience Percent:\s*([+-]?\d+)/i);
      const musFlatExpMatch = combined.match(/Muscle Experience:\s*([+-]?\d+)/i);
      if (musExpMatch || musFlatExpMatch) {
        const val = musExpMatch ? parseInt(musExpMatch[1], 10) : parseInt(musFlatExpMatch![1], 10);
        const suffix = musExpMatch ? '%' : '';
        response.generalQuestBuffs.statGainsMus.push({
          ...baseItem,
          extractedNumericBonus: val,
          extractedBonus: `${val > 0 ? '+' : ''}${val}${suffix}`,
          extractedStat: `${val > 0 ? '+' : ''}${val}${suffix} Muscle Gains`,
        });
      }

      // +mys% gains
      const mysExpMatch = combined.match(/Mysticality Experience Percent:\s*([+-]?\d+)/i);
      const mysFlatExpMatch = combined.match(/Mysticality Experience:\s*([+-]?\d+)/i);
      if (mysExpMatch || mysFlatExpMatch) {
        const val = mysExpMatch ? parseInt(mysExpMatch[1], 10) : parseInt(mysFlatExpMatch![1], 10);
        const suffix = mysExpMatch ? '%' : '';
        response.generalQuestBuffs.statGainsMys.push({
          ...baseItem,
          extractedNumericBonus: val,
          extractedBonus: `${val > 0 ? '+' : ''}${val}${suffix}`,
          extractedStat: `${val > 0 ? '+' : ''}${val}${suffix} Myst Gains`,
        });
      }

      // +mox% gains
      const moxExpMatch = combined.match(/Moxie Experience Percent:\s*([+-]?\d+)/i);
      const moxFlatExpMatch = combined.match(/Moxie Experience:\s*([+-]?\d+)/i);
      if (moxExpMatch || moxFlatExpMatch) {
        const val = moxExpMatch ? parseInt(moxExpMatch[1], 10) : parseInt(moxFlatExpMatch![1], 10);
        const suffix = moxExpMatch ? '%' : '';
        response.generalQuestBuffs.statGainsMox.push({
          ...baseItem,
          extractedNumericBonus: val,
          extractedBonus: `${val > 0 ? '+' : ''}${val}${suffix}`,
          extractedStat: `${val > 0 ? '+' : ''}${val}${suffix} Moxie Gains`,
        });
      }

      // Familiar
      // Familiar Weight
      const famWeightMatch = combined.match(/Familiar Weight:\s*([+-]?\d+)/i);
      if (famWeightMatch) {
        const bonus = parseInt(famWeightMatch[1], 10);
        response.generalQuestBuffs.familiarWeight.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus} lbs`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} lbs Familiar Weight`,
        });
      }

      // Familiar Experience
      const famExpMatch = combined.match(
        /(?:Familiar Experience|Familiar Experience Percent):\s*([+-]?\d+)/i,
      );
      if (famExpMatch) {
        const bonus = parseInt(famExpMatch[1], 10);
        response.generalQuestBuffs.familiarExp.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Familiar Experience`,
        });
      }

      // Initiative%
      const initMatch = combined.match(/Initiative:\s*([+-]?\d+)/i);
      if (initMatch) {
        const bonus = parseInt(initMatch[1], 10);
        response.generalQuestBuffs.initiative.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Initiative`,
        });
      }

      // Monster Level: +ML (General Quest Buffs)
      const mlMatch = combined.match(/Monster Level:\s*([+-]?\d+)/i);
      if (mlMatch) {
        const mlVal = parseInt(mlMatch[1], 10);
        if (mlVal > 0) {
          response.generalQuestBuffs.monsterLevel.push({
            ...baseItem,
            extractedNumericBonus: mlVal,
            extractedBonus: `+${mlVal} ML`,
            extractedStat: `+${mlVal} Monster Level`,
          });
        }
      }

      // ==========================================
      // 3. -- Quest Specific Buffs --
      // ==========================================
      // Smut Orcs: - Monster Level
      if (mlMatch) {
        const mlVal = parseInt(mlMatch[1], 10);
        if (mlVal < 0) {
          // Negative ML reduces bridge parts needed!
          response.questSpecificBuffs.minusMonsterLevel.push({
            ...baseItem,
            extractedNumericBonus: Math.abs(mlVal),
            extractedBonus: `${mlVal} ML`,
            extractedStat: `${mlVal} Monster Level (Bridge Rush)`,
          });
        }
      }

      // Smut Orcs: Potion that gives exact "Frosty" effect
      if (isPotion && effectName && effectName.trim().toLowerCase() === 'frosty') {
        response.questSpecificBuffs.frostyEffect.push({
          ...baseItem,
          extractedNumericBonus: effectDuration || 1,
          extractedBonus: 'Frosty',
          extractedStat: `Grants exact "Frosty" effect (${effectDuration || '?'} turns)`,
        });
      }

      // Smut Orcs: Flat Weapon Damage
      const wFlatMatch = combined.match(
        /(?<!Percent:\s*)(?<!Percent:\s*\+)(?<!Percent:\s*-)\bWeapon Damage:\s*([+-]?\d+)/i,
      );
      if (wFlatMatch) {
        const bonus = parseInt(wFlatMatch[1], 10);
        response.questSpecificBuffs.flatWeaponDamage.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Flat Weapon Damage`,
        });
      }

      // Smut Orcs: Weapon Damage %
      const wPctMatch = combined.match(/Weapon Damage Percent:\s*([+-]?\d+)/i);
      if (wPctMatch) {
        const bonus = parseInt(wPctMatch[1], 10);
        response.questSpecificBuffs.weaponDamagePercent.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Weapon Damage`,
        });
      }

      // Smut Orcs: Flat Spell Damage
      const sFlatMatch = combined.match(
        /(?<!(?:Cold |Hot |Stench |Spooky |Sleaze |Percent:\s*|\+|-))\bSpell Damage:\s*([+-]?\d+)/i,
      );
      if (sFlatMatch) {
        const bonus = parseInt(sFlatMatch[1], 10);
        response.questSpecificBuffs.flatSpellDamage.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Flat Spell Damage`,
        });
      }

      // Smut Orcs: Spell Damage %
      const sPctMatch = combined.match(/Spell Damage Percent:\s*([+-]?\d+)/i);
      if (sPctMatch) {
        const bonus = parseInt(sPctMatch[1], 10);
        response.questSpecificBuffs.spellDamagePercent.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Spell Damage`,
        });
      }

      // Elemental Resistance
      const checkRes = (elem: 'Cold' | 'Hot' | 'Stench' | 'Spooky' | 'Sleaze', arr: TCRSItem[]) => {
        const rMatch = combined.match(new RegExp(`${elem} Resistance:\\s*([+-]?\\d+)`, 'i'));
        if (rMatch) {
          const bonus = parseInt(rMatch[1], 10);
          arr.push({
            ...baseItem,
            extractedNumericBonus: bonus,
            extractedBonus: `+${bonus}`,
            extractedStat: `+${bonus} ${elem} Resistance`,
          });
        }
      };
      checkRes('Cold', response.questSpecificBuffs.resCold);
      checkRes('Hot', response.questSpecificBuffs.resHot);
      checkRes('Stench', response.questSpecificBuffs.resStench);
      checkRes('Spooky', response.questSpecificBuffs.resSpooky);
      checkRes('Sleaze', response.questSpecificBuffs.resSleaze);

      // Elemental Dmg/Elemental Spell Dmg
      const checkDmg = (elem: 'Cold' | 'Hot' | 'Stench' | 'Spooky' | 'Sleaze', arr: TCRSItem[]) => {
        const dmgMatch = combined.match(
          new RegExp(`(?:${elem} Damage|${elem} Spell Damage):\\s*([+-]?\\d+)`, 'i'),
        );
        if (dmgMatch) {
          const bonus = parseInt(dmgMatch[1], 10);
          arr.push({
            ...baseItem,
            extractedNumericBonus: bonus,
            extractedBonus: `+${bonus}`,
            extractedStat: `+${bonus} ${elem} (Spell) Dmg`,
          });
        }
      };
      checkDmg('Cold', response.questSpecificBuffs.dmgCold);
      checkDmg('Hot', response.questSpecificBuffs.dmgHot);
      checkDmg('Stench', response.questSpecificBuffs.dmgStench);
      checkDmg('Spooky', response.questSpecificBuffs.dmgSpooky);
      checkDmg('Sleaze', response.questSpecificBuffs.dmgSleaze);

      // ==========================================
      // 4. -- Survival Buffs --
      // ==========================================
      // Special Buffs:
      // 1. Super Skill
      if (effectName && effectName.toLowerCase().includes('super skill')) {
        response.survivalBuffs.superSkill.push({
          ...baseItem,
          extractedNumericBonus: effectDuration || 1,
          extractedBonus: '0 MP Cost',
          extractedStat: `Super Skill: 0 MP Skills (${effectDuration || '?'} turns)`,
        });
      }

      // Turn Generation Special Buffs:
      // 1. The Ode to Booze
      if (
        (effectName &&
          (effectName.toLowerCase().includes('ode to booze') ||
            effectName.toLowerCase() === 'the ode to booze')) ||
        combined.toLowerCase().includes('ode to booze')
      ) {
        const odeItem: TCRSItem = {
          ...baseItem,
          extractedNumericBonus: effectDuration || 1,
          extractedBonus: '+Advs / Drink',
          extractedStat: `The Ode to Booze: +Advs from Booze (${effectDuration || '?'} turns)`,
        };
        response.turnGeneration.odeToBooze.push(odeItem);
        response.survivalBuffs.odeToBooze.push(odeItem);
      }

      // 2. Gar-ish
      const foodAdvMatch = combined.match(/Adventures from Food:\s*([+-]?\d+)/i);
      if (
        (effectName && effectName.toLowerCase().includes('gar-ish')) ||
        combined.toLowerCase().includes('gar-ish') ||
        foodAdvMatch
      ) {
        const bonus = foodAdvMatch ? parseInt(foodAdvMatch[1], 10) : 5;
        response.turnGeneration.garish.push({
          ...baseItem,
          extractedNumericBonus: effectDuration || bonus || 1,
          extractedBonus: `+${bonus} / Food`,
          extractedStat: `Gar-ish: +${bonus} Advs from Food (${effectDuration || '?'} turns)`,
        });
      }

      // 3. Frosty
      if (effectName && effectName.toLowerCase().includes('frosty')) {
        response.survivalBuffs.frosty.push({
          ...baseItem,
          extractedNumericBonus: effectDuration || 1,
          extractedBonus: effectName,
          extractedStat: `Grants "${effectName}" (${effectDuration || '?'} turns)`,
        });
      }

      // 4. Inigo's Incantation of Inspiration
      if (
        (effectName && effectName.toLowerCase().includes('inigo')) ||
        combined.toLowerCase().includes("inigo's incantation of inspiration")
      ) {
        response.survivalBuffs.inigos.push({
          ...baseItem,
          extractedNumericBonus: effectDuration || 1,
          extractedBonus: "Inigo's",
          extractedStat: `Inigo's Incantation of Inspiration (${effectDuration ? `${effectDuration} turns` : 'Free crafting'})`,
        });
      }

      // Mainstat Buffs
      // +Muscle flat
      const musFlatMatch = combined.match(
        /(?<!Percent:\s*)(?<!Percent:\s*\+)(?<!Percent:\s*-)\bMuscle:\s*([+-]?\d+)/i,
      );
      if (musFlatMatch) {
        const bonus = parseInt(musFlatMatch[1], 10);
        response.survivalBuffs.flatMuscle.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Flat Muscle`,
        });
      }

      // +Muscle%
      const musPctMatch = combined.match(/Muscle Percent:\s*([+-]?\d+)/i);
      if (musPctMatch) {
        const bonus = parseInt(musPctMatch[1], 10);
        response.survivalBuffs.musclePercent.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Muscle`,
        });
      }

      // +Mysticality flat
      const mystFlatMatch = combined.match(
        /(?<!Percent:\s*)(?<!Percent:\s*\+)(?<!Percent:\s*-)\bMysticality:\s*([+-]?\d+)/i,
      );
      if (mystFlatMatch) {
        const bonus = parseInt(mystFlatMatch[1], 10);
        response.survivalBuffs.flatMysticality.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Flat Mysticality`,
        });
      }

      // +Mysticality%
      const mystPctMatch = combined.match(/Mysticality Percent:\s*([+-]?\d+)/i);
      if (mystPctMatch) {
        const bonus = parseInt(mystPctMatch[1], 10);
        response.survivalBuffs.mysticalityPercent.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Mysticality`,
        });
      }

      // +Moxie flat
      const moxFlatMatch = combined.match(
        /(?<!Percent:\s*)(?<!Percent:\s*\+)(?<!Percent:\s*-)\bMoxie:\s*([+-]?\d+)/i,
      );
      if (moxFlatMatch) {
        const bonus = parseInt(moxFlatMatch[1], 10);
        response.survivalBuffs.flatMoxie.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus} Flat Moxie`,
        });
      }

      // +Moxie%
      const moxPctMatch = combined.match(/Moxie Percent:\s*([+-]?\d+)/i);
      if (moxPctMatch) {
        const bonus = parseInt(moxPctMatch[1], 10);
        response.survivalBuffs.moxiePercent.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `${bonus > 0 ? '+' : ''}${bonus}%`,
          extractedStat: `${bonus > 0 ? '+' : ''}${bonus}% Moxie`,
        });
      }

      // Damage Absorption
      const daMatch = combined.match(/Damage Absorption:\s*([+-]?\d+)/i);
      if (daMatch) {
        const bonus = parseInt(daMatch[1], 10);
        response.survivalBuffs.damageAbsorption.push({
          ...baseItem,
          extractedNumericBonus: bonus,
          extractedBonus: `+${bonus}`,
          extractedStat: `+${bonus} Damage Absorption`,
        });
      }

      // MP regeneration
      const mpMin = combined.match(/MP Regen Min:\s*(\d+)/i);
      const mpMax = combined.match(/MP Regen Max:\s*(\d+)/i);
      const mpSingle = combined.match(/MP Regen:\s*([+-]?\d+)/i);
      if (mpMin || mpSingle) {
        const minVal = mpMin ? parseInt(mpMin[1], 10) : parseInt(mpSingle![1], 10);
        const maxVal = mpMax ? parseInt(mpMax[1], 10) : minVal;
        const display = minVal === maxVal ? `${minVal} MP` : `${minVal}-${maxVal} MP`;
        response.survivalBuffs.mpRegen.push({
          ...baseItem,
          extractedNumericBonus: maxVal,
          extractedBonus: display,
          extractedStat: `${display} / adv`,
        });
      }
    }
  }

  // AUTOMATICALLY ORGANIZE THE BUFFS IN ORDER OF MOST TO LEAST OF THEIR EFFECT:
  sortByMostToLeast(response.turnGeneration.food);
  sortByMostToLeast(response.turnGeneration.booze);
  sortByMostToLeast(response.turnGeneration.rolloverAdventures);
  sortByMostToLeast(response.turnGeneration.odeToBooze);
  sortByMostToLeast(response.turnGeneration.garish);

  sortByMostToLeast(response.generalQuestBuffs.noncombat);
  sortByMostToLeast(response.generalQuestBuffs.combat);
  sortByMostToLeast(response.generalQuestBuffs.monsterLevel);
  sortByMostToLeast(response.generalQuestBuffs.normalItemDrop);
  sortByMostToLeast(response.generalQuestBuffs.foodDrop);
  sortByMostToLeast(response.generalQuestBuffs.boozeDrop);
  sortByMostToLeast(response.generalQuestBuffs.meatDrop);
  sortByMostToLeast(response.generalQuestBuffs.statGainsBasic);
  sortByMostToLeast(response.generalQuestBuffs.statGainsMus);
  sortByMostToLeast(response.generalQuestBuffs.statGainsMys);
  sortByMostToLeast(response.generalQuestBuffs.statGainsMox);
  sortByMostToLeast(response.generalQuestBuffs.familiarWeight);
  sortByMostToLeast(response.generalQuestBuffs.familiarExp);
  sortByMostToLeast(response.generalQuestBuffs.initiative);

  sortByMostToLeast(response.questSpecificBuffs.minusMonsterLevel);
  sortByMostToLeast(response.questSpecificBuffs.frostyEffect);
  sortByMostToLeast(response.questSpecificBuffs.flatWeaponDamage);
  sortByMostToLeast(response.questSpecificBuffs.weaponDamagePercent);
  sortByMostToLeast(response.questSpecificBuffs.flatSpellDamage);
  sortByMostToLeast(response.questSpecificBuffs.spellDamagePercent);
  sortByMostToLeast(response.questSpecificBuffs.resCold);
  sortByMostToLeast(response.questSpecificBuffs.resHot);
  sortByMostToLeast(response.questSpecificBuffs.resStench);
  sortByMostToLeast(response.questSpecificBuffs.resSpooky);
  sortByMostToLeast(response.questSpecificBuffs.resSleaze);
  sortByMostToLeast(response.questSpecificBuffs.dmgCold);
  sortByMostToLeast(response.questSpecificBuffs.dmgHot);
  sortByMostToLeast(response.questSpecificBuffs.dmgStench);
  sortByMostToLeast(response.questSpecificBuffs.dmgSpooky);
  sortByMostToLeast(response.questSpecificBuffs.dmgSleaze);

  sortByMostToLeast(response.survivalBuffs.superSkill);
  sortByMostToLeast(response.survivalBuffs.odeToBooze);
  sortByMostToLeast(response.survivalBuffs.frosty);
  sortByMostToLeast(response.survivalBuffs.inigos);
  sortByMostToLeast(response.survivalBuffs.flatMuscle);
  sortByMostToLeast(response.survivalBuffs.musclePercent);
  sortByMostToLeast(response.survivalBuffs.flatMysticality);
  sortByMostToLeast(response.survivalBuffs.mysticalityPercent);
  sortByMostToLeast(response.survivalBuffs.flatMoxie);
  sortByMostToLeast(response.survivalBuffs.moxiePercent);
  sortByMostToLeast(response.survivalBuffs.damageAbsorption);
  sortByMostToLeast(response.survivalBuffs.mpRegen);

  // Summary counts
  response.summary = {
    food: response.turnGeneration.food.length,
    booze: response.turnGeneration.booze.length,
    rolloverAdventures: response.turnGeneration.rolloverAdventures.length,
    noncombat: response.generalQuestBuffs.noncombat.length,
    combat: response.generalQuestBuffs.combat.length,
    monsterLevel: response.generalQuestBuffs.monsterLevel.length,
    normalItemDrop: response.generalQuestBuffs.normalItemDrop.length,
    meatDrop: response.generalQuestBuffs.meatDrop.length,
    initiative: response.generalQuestBuffs.initiative.length,
    minusMonsterLevel: response.questSpecificBuffs.minusMonsterLevel.length,
    frostyEffect: response.questSpecificBuffs.frostyEffect.length,
    flatWeaponDamage: response.questSpecificBuffs.flatWeaponDamage.length,
    weaponDamagePercent: response.questSpecificBuffs.weaponDamagePercent.length,
    flatSpellDamage: response.questSpecificBuffs.flatSpellDamage.length,
    spellDamagePercent: response.questSpecificBuffs.spellDamagePercent.length,
    superSkill: response.survivalBuffs.superSkill.length,
    odeToBooze: response.survivalBuffs.odeToBooze.length,
    frosty: response.survivalBuffs.frosty.length,
    inigos: response.survivalBuffs.inigos.length,
    damageAbsorption: response.survivalBuffs.damageAbsorption.length,
    mpRegen: response.survivalBuffs.mpRegen.length,
  };

  return response;
}

export async function parseTCRSFile(className: string, moonSign: string): Promise<TCRSDataResponse> {
  const cacheKey = `${className.replace(/\s+/g, '_')}_${moonSign.replace(/\s+/g, '_')}`;
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;

  const pending = inFlightResponses.get(cacheKey);
  if (pending) return pending;

  const request = parseTCRSFileUncached(className, moonSign)
    .then((response) => {
      responseCache.set(cacheKey, response);
      return response;
    })
    .finally(() => {
      inFlightResponses.delete(cacheKey);
    });

  inFlightResponses.set(cacheKey, request);
  return request;
}

export function clearTCRSCaches(): void {
  responseCache.clear();
  githubFileCache.clear();
  inFlightResponses.clear();
}
