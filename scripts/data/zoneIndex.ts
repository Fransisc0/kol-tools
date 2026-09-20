export function sortedRecord<T>(map: ReadonlyMap<string, T>): Record<string, T> {
  return Object.fromEntries(
    [...map.entries()].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );
}

/** Preserve the viewer's zone enrichment while rebuilding its current reference index. */
export function buildZoneIndex(combatsRaw: string, monstersRaw: string, concoctionsRaw: string): Record<string, string[]> {
  const monsterZones = new Map<string, string[]>();
  const itemZones = new Map<string, string[]>();

  for (const line of combatsRaw.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    for (const value of parts.slice(2)) {
      const monster = value.replace(/:.*/, '').trim();
      const zones = monsterZones.get(monster) ?? [];
      if (!zones.includes(parts[0])) zones.push(parts[0]);
      monsterZones.set(monster, zones);
    }
  }

  for (const line of monstersRaw.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    const zones = monsterZones.get(parts[0]);
    if (parts.length < 4 || !zones) continue;
    for (const value of parts.slice(4)) {
      const item = value.replace(/\(.*\)/, '').trim().replace(/^[pncf]+\s+/, '').trim().toLowerCase();
      const existing = itemZones.get(item) ?? [];
      for (const zone of zones) if (!existing.includes(zone)) existing.push(zone);
      itemZones.set(item, existing);
    }
  }

  for (let iteration = 0, changed = true; changed && iteration < 10; iteration += 1) {
    changed = false;
    for (const line of concoctionsRaw.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const parts = line.split('\t').map((value) => value.trim());
      if (parts.length < 3 || !parts[1].toUpperCase().includes('SMITH')) continue;
      const craftedItem = parts[0].toLowerCase();
      const existing = itemZones.get(craftedItem) ?? [];
      for (const ingredient of parts.slice(2).map((value) => value.toLowerCase())) {
        for (const zone of itemZones.get(ingredient) ?? []) {
          if (!existing.includes(zone)) {
            existing.push(zone);
            changed = true;
          }
        }
      }
      if (existing.length) itemZones.set(craftedItem, existing);
    }
  }

  return sortedRecord(itemZones);
}
