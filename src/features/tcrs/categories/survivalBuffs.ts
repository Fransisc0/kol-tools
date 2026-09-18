import type { CategoryRuleContext } from './types';
import type { TCRSItem } from '../../../types';

export function applySurvivalBuffRules(context: CategoryRuleContext): void {
  const { response, baseItem, combined, effectName, effectDuration } = context;
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
