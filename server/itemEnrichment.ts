import type { ItemTagType } from '../src/types';
import { normalizeLookupName, type ReferenceData } from './referenceData';

const hermitItems = new Set([
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

export interface ItemSourceEnrichment {
  tags: ItemTagType[];
  sourceDetails: string[];
}

export function getItemSourceEnrichment(
  originalName: string,
  referenceData: ReferenceData,
): ItemSourceEnrichment {
  const lookupName = normalizeLookupName(originalName);
  const tags: ItemTagType[] = [];
  const sourceDetails: string[] = [];
  const isThrifty = referenceData.thriftyWhitelist.has(lookupName);

  if (isThrifty) tags.push('Thrifty Accessible');
  else {
    tags.push('Non-Thrifty');
    sourceDetails.push('Non-Thrifty (Not in Whitelist)');
  }

  const stores = referenceData.npcStores.get(lookupName) ?? [];
  if (stores.length > 0) {
    tags.push('NPC Store');
    sourceDetails.push(...stores);
  }
  if (hermitItems.has(lookupName)) {
    if (!tags.includes('NPC Store')) tags.push('NPC Store');
    if (!sourceDetails.includes('The Hermit')) sourceDetails.push('The Hermit');
  }

  const craftMethods = referenceData.craftMethods.get(lookupName) ?? [];
  if (craftMethods.length > 0) {
    tags.push('Craftable', 'Easily Craftable Recipe');
    for (const method of craftMethods) {
      if (!sourceDetails.includes(method)) sourceDetails.push(method);
    }
  }

  if (sourceDetails.length === 0) {
    sourceDetails.push(isThrifty ? 'In-run Drop / Evergreen Standard' : 'Non-Thrifty');
  }

  return { tags, sourceDetails };
}
