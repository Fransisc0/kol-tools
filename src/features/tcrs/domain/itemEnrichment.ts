import type { ItemTagType } from '../../../types';
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

export function getItemSourceEnrichment(originalName: string, references: ReferenceData) {
  const lookupName = normalizeLookupName(originalName);
  const tags: ItemTagType[] = [];
  const sourceDetails: string[] = [];
  const isThrifty = references.thriftyWhitelist.has(lookupName);

  if (isThrifty) tags.push('Thrifty Accessible');
  else {
    tags.push('Non-Thrifty');
    sourceDetails.push('Non-Thrifty (Not in Whitelist)');
  }

  const stores = references.npcStores.get(lookupName) ?? [];
  if (stores.length) {
    tags.push('NPC Store');
    sourceDetails.push(...stores);
  }
  if (hermitItems.has(lookupName)) {
    if (!tags.includes('NPC Store')) tags.push('NPC Store');
    if (!sourceDetails.includes('The Hermit')) sourceDetails.push('The Hermit');
  }

  const methods = references.craftMethods.get(lookupName) ?? [];
  if (methods.length) {
    tags.push('Craftable', 'Easily Craftable Recipe');
    for (const method of methods) if (!sourceDetails.includes(method)) sourceDetails.push(method);
  }

  if (!sourceDetails.length) {
    sourceDetails.push(isThrifty ? 'In-run Drop / Evergreen Standard' : 'Non-Thrifty');
  }
  return { tags, sourceDetails };
}
