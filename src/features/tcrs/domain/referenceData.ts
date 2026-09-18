export interface ItemMetadata {
  name: string;
  image: string;
  use: string;
}

export interface SerializedReferenceData {
  version: 1;
  items: Array<[number, ItemMetadata]>;
  effectModifiers: Record<string, string>;
  npcStores: Record<string, string[]>;
  craftMethods: Record<string, string[]>;
  thriftyWhitelist: string[];
  itemZones: Record<string, string[]>;
}

export interface ReferenceData {
  items: ReadonlyMap<number, ItemMetadata>;
  effectModifiers: ReadonlyMap<string, string>;
  npcStores: ReadonlyMap<string, string[]>;
  craftMethods: ReadonlyMap<string, string[]>;
  thriftyWhitelist: ReadonlySet<string>;
  itemZones: Readonly<Record<string, string[]>>;
}

export function deserializeReferenceData(data: SerializedReferenceData): ReferenceData {
  if (data.version !== 1) throw new Error('Unsupported reference-data version.');
  return {
    items: new Map(data.items),
    effectModifiers: new Map(Object.entries(data.effectModifiers)),
    npcStores: new Map(Object.entries(data.npcStores)),
    craftMethods: new Map(Object.entries(data.craftMethods)),
    thriftyWhitelist: new Set(data.thriftyWhitelist),
    itemZones: data.itemZones,
  };
}

export function normalizeLookupName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&trade;?/g, '™')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/&#39;/g, "'")
    .trim();
}
