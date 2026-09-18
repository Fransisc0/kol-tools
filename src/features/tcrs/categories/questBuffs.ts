import type { CategoryRuleContext } from './types';
import type { TCRSItem } from '../../../types';

export function applyQuestBuffRules(context: CategoryRuleContext): void {
  const { response, baseItem, combined, isPotion, effectName, effectDuration } = context;
  const mlMatch = combined.match(/Monster Level:\s*([+-]?\d+)/i);
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
}
