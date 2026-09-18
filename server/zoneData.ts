import fs from 'fs';
import path from 'path';

let itemToZonesCache: Record<string, string[]> | null = null;

export function getItemZones(itemName: string): string[] {
  if (!itemToZonesCache) {
    itemToZonesCache = {};
    try {
      const monstersRaw = fs.readFileSync(path.join(process.cwd(), 'data/kolmafia/monsters.txt'), 'utf8');
      const combatsRaw = fs.readFileSync(path.join(process.cwd(), 'data/kolmafia/combats.txt'), 'utf8');

      // monsterName -> [zones]
      const monsterToZones: Record<string, string[]> = {};

      for (const line of combatsRaw.split('\n')) {
        if (!line || line.startsWith('#')) continue;
        const parts = line.split('\t');
        if (parts.length < 3) continue;
        const zoneName = parts[0];

        for (let i = 2; i < parts.length; i++) {
          let m = parts[i];
          m = m.replace(/:.*/, '').trim();
          if (!monsterToZones[m]) monsterToZones[m] = [];
          monsterToZones[m].push(zoneName);
        }
      }

      for (const line of monstersRaw.split('\n')) {
        if (!line || line.startsWith('#')) continue;
        const parts = line.split('\t');
        if (parts.length < 4) continue;
        const monsterName = parts[0];

        for (let i = 4; i < parts.length; i++) {
          let drop = parts[i];
          drop = drop.replace(/\(.*\)/, '').trim();

          const match = drop.match(/^([pncf]+)\s+(.*)/);
          if (match) {
            drop = match[2].trim();
          }
          drop = drop.toLowerCase();

          if (monsterToZones[monsterName]) {
            if (!itemToZonesCache[drop]) itemToZonesCache[drop] = [];
            for (const z of monsterToZones[monsterName]) {
              if (!itemToZonesCache[drop].includes(z)) {
                itemToZonesCache[drop].push(z);
              }
            }
          }
        }
      }

      // Propagate zones for meatsmithing and armor crafting
      const concoctionsRaw = fs.readFileSync(
        path.join(process.cwd(), 'data/kolmafia/concoctions.txt'),
        'utf8',
      );

      let addedZones = true;
      let iterations = 0;
      while (addedZones && iterations < 10) {
        addedZones = false;
        iterations++;
        for (const line of concoctionsRaw.split('\n')) {
          if (!line || line.startsWith('#')) continue;
          const parts = line.split('\t').map((x) => x.trim());
          if (parts.length < 3) continue;

          const craftedItem = parts[0].toLowerCase();
          const method = parts[1].toUpperCase();

          if (method.includes('SMITH')) {
            const ingredients = parts.slice(2).map((x) => x.toLowerCase());

            for (const ing of ingredients) {
              const ingZones = itemToZonesCache[ing] || [];
              for (const z of ingZones) {
                if (!itemToZonesCache[craftedItem]) itemToZonesCache[craftedItem] = [];
                if (!itemToZonesCache[craftedItem].includes(z)) {
                  itemToZonesCache[craftedItem].push(z);
                  addedZones = true;
                }
              }
            }
          }
        }
      }
    } catch {
      console.error(JSON.stringify({ level: 'error', event: 'zone_data_parse_failed' }));
    }
  }

  return itemToZonesCache[itemName.toLowerCase()] || [];
}
