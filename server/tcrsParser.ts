import type { TCRSDataResponse, TCRSItem } from '../src/types';
import { getMonsterManualEntry } from '../src/data/monsterManualData';
import { getItemZones } from './zoneData';
import { createBaseItem, isEquipmentUse, isPotionUse, parseEffectMetadata } from './itemNormalization';
import { createEmptyResponse } from './responseFactory';
import { AsyncGate } from './asyncGate';
import { clearTCRSDataSourceCache, getTCRSFileContent } from './tcrsDataSource';
import { TimedLruCache } from './timedLruCache';
import { getItemSourceEnrichment } from './itemEnrichment';
import { clearReferenceDataCache, loadReferenceData } from './referenceData';
import { finalizeResponse } from './responseFinalizer';

const CACHE_TTL_MS = 10 * 60 * 1000;
const responseCache = new TimedLruCache<TCRSDataResponse>(6, CACHE_TTL_MS);
const inFlightResponses = new Map<string, Promise<TCRSDataResponse>>();
const parserGate = new AsyncGate(2);

export { loadReferenceData } from './referenceData';

// Helper to automatically sort items from most to least of their effect
async function parseTCRSFileUncached(className: string, moonSign: string): Promise<TCRSDataResponse> {
  const normClass = className.replace(/\s+/g, '_');
  const normSign = moonSign.replace(/\s+/g, '_');

  const referenceData = loadReferenceData();

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

      const origMeta = referenceData.items.get(id) || {
        name: tcrsName,
        image: '',
        use: forcedType || 'none',
      };

      const primaryUse = (forcedType || origMeta.use.split(',')[0].trim()).toLowerCase();

      const effect = parseEffectMetadata(itemModifiers, referenceData.effectModifiers);
      const { effectName, effectDuration, effectModifiers } = effect;
      const isPotion = isPotionUse(primaryUse, origMeta.use, Boolean(effectName));
      const isEquipment = isEquipmentUse(primaryUse);

      const itemZones = getItemZones(origMeta.name);

      const { tags, sourceDetails } = getItemSourceEnrichment(origMeta.name, referenceData);

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
        tags.push('The Sea');
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

      // Include every booze quality; the client defaults to an EPIC-only view.
      if (primaryUse === 'drink' || forcedType === 'drink') {
        const qualityLabel = quality.trim() || 'Unknown quality';
        response.turnGeneration.booze.push({
          ...baseItem,
          extractedNumericBonus: size,
          extractedBonus: `${qualityLabel} (Size ${size})`,
          extractedStat: `${qualityLabel} Booze (Size ${size})`,
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

  return finalizeResponse(response);
}

export async function parseTCRSFile(className: string, moonSign: string): Promise<TCRSDataResponse> {
  const cacheKey = `${className.replace(/\s+/g, '_')}_${moonSign.replace(/\s+/g, '_')}`;
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;

  const pending = inFlightResponses.get(cacheKey);
  if (pending) return pending;

  const request = parserGate
    .run(() => parseTCRSFileUncached(className, moonSign))
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
  clearReferenceDataCache();
  clearTCRSDataSourceCache();
  inFlightResponses.clear();
}
