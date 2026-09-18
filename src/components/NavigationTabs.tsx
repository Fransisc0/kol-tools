import { TCRSDataResponse, TCRSItem } from '../types';
import { categorizeNPCStore } from '../npcStoreMapping';
import { categorizeZone } from '../zoneMapping';

export interface SubCategoryOption {
  id: string;
  label: string;
}

export const PURPOSE_OPTIONS: Readonly<Record<string, SubCategoryOption[]>> = {
  'turn-generation': [
    { id: 'food', label: 'Food' },
    { id: 'booze', label: 'Booze' },
    { id: 'rolloverAdventures', label: 'Rollover Adventures' },
    { id: 'odeToBooze', label: 'The Ode to Booze' },
    { id: 'garish', label: 'Gar-ish' },
  ],
  buffs: [
    { id: 'noncombat', label: 'Noncombat' },
    { id: 'combat', label: 'Combat' },
    { id: 'monsterLevel', label: '+ Monster Level' },
    { id: 'normalItemDrop', label: '+Item% drops' },
    { id: 'foodDrop', label: '+Food% drops' },
    { id: 'boozeDrop', label: '+Booze% drops' },
    { id: 'meatDrop', label: 'Meat%' },
    { id: 'statGainsBasic', label: 'Flat + stat gains/fight' },
    { id: 'statGainsMus', label: '+Mus% gains' },
    { id: 'statGainsMys', label: '+Mys% gains' },
    { id: 'statGainsMox', label: '+Mox% gains' },
    { id: 'familiarWeight', label: 'Familiar Weight' },
    { id: 'familiarExp', label: 'Familiar Experience' },
    { id: 'initiative', label: 'Initiative%' },
    { id: 'minusMonsterLevel', label: '- Monster Level' },
    { id: 'resCold', label: 'Cold Resistance' },
    { id: 'resHot', label: 'Hot Resistance' },
    { id: 'resStench', label: 'Stench Resistance' },
    { id: 'resSpooky', label: 'Spooky Resistance' },
    { id: 'resSleaze', label: 'Sleaze Resistance' },
    { id: 'dmgCold', label: 'Cold Dmg / Spell Dmg' },
    { id: 'dmgHot', label: 'Hot Dmg / Spell Dmg' },
    { id: 'dmgStench', label: 'Stench Dmg / Spell Dmg' },
    { id: 'dmgSpooky', label: 'Spooky Dmg / Spell Dmg' },
    { id: 'dmgSleaze', label: 'Sleaze Dmg / Spell Dmg' },
    { id: 'flatMuscle', label: '+Muscle' },
    { id: 'flatMysticality', label: '+Mysticality' },
    { id: 'flatMoxie', label: '+Moxie' },
    { id: 'musclePercent', label: '+Muscle%' },
    { id: 'mysticalityPercent', label: '+Mysticality%' },
    { id: 'moxiePercent', label: '+Moxie%' },
    { id: 'damageAbsorption', label: 'Damage Absorption' },
    { id: 'mpRegen', label: 'MP regeneration' },
  ],
};

function getAllItems(data: TCRSDataResponse): TCRSItem[] {
  if (data.allItems?.length) return data.allItems;
  const items = new Map<number, TCRSItem>();
  for (const category of [
    data.turnGeneration,
    data.generalQuestBuffs,
    data.questSpecificBuffs,
    data.survivalBuffs,
  ]) {
    for (const values of Object.values(category || {})) {
      if (Array.isArray(values)) values.forEach((item) => items.set(item.id, item));
    }
  }
  return [...items.values()];
}

export function getSubCategoryTabs(
  data: TCRSDataResponse | null,
  groupingMode: string,
  activeSection: string,
): SubCategoryOption[] {
  if (!data) return [];
  if (groupingMode === 'Purpose') return PURPOSE_OPTIONS[activeSection] || [];
  if (groupingMode === 'All') return [];

  const options = new Set<string>();
  for (const item of getAllItems(data)) {
    if (groupingMode === 'NPC Store' && item.tags.includes('NPC Store')) {
      for (const source of item.sourceDetails) {
        const isStore =
          source !== 'In-run Drop / Evergreen Standard' &&
          source !== 'Non-Thrifty' &&
          !source.includes('Recipe');
        if (isStore && categorizeNPCStore(source) === activeSection) options.add(source);
      }
    } else if (groupingMode === 'Zone') {
      for (const zone of item.zones || []) {
        if (categorizeZone(zone) === activeSection) options.add(zone);
      }
    }
  }

  const sorted = [...options].sort((a, b) => a.localeCompare(b)).map((label) => ({ id: label, label }));
  return sorted.length ? [{ id: '__ALL__', label: 'All' }, ...sorted] : [];
}
