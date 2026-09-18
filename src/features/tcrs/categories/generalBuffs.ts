import type { CategoryRuleContext } from './types';

export function applyGeneralBuffRules(context: CategoryRuleContext): void {
  const { response, baseItem, combined } = context;
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
  const expPctMatch = combined.match(/(?<!(?:Muscle|Mysticality|Moxie) )Experience Percent:\s*([+-]?\d+)/i);
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
  const famExpMatch = combined.match(/(?:Familiar Experience|Familiar Experience Percent):\s*([+-]?\d+)/i);
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
}
