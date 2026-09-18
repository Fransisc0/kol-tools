import type { TCRSDataResponse, TCRSItem } from '../src/types';

function sortDescending(items: TCRSItem[]): void {
  items.sort((left, right) => right.extractedNumericBonus - left.extractedNumericBonus);
}

export function finalizeResponse(response: TCRSDataResponse): TCRSDataResponse {
  const groups: TCRSItem[][] = [
    ...Object.values(response.turnGeneration),
    ...Object.values(response.generalQuestBuffs),
    ...Object.values(response.questSpecificBuffs),
    ...Object.values(response.survivalBuffs),
  ];
  for (const group of groups) sortDescending(group);

  response.summary = {
    food: response.turnGeneration.food.length,
    booze: response.turnGeneration.booze.length,
    rolloverAdventures: response.turnGeneration.rolloverAdventures.length,
    noncombat: response.generalQuestBuffs.noncombat.length,
    combat: response.generalQuestBuffs.combat.length,
    monsterLevel: response.generalQuestBuffs.monsterLevel.length,
    normalItemDrop: response.generalQuestBuffs.normalItemDrop.length,
    meatDrop: response.generalQuestBuffs.meatDrop.length,
    initiative: response.generalQuestBuffs.initiative.length,
    minusMonsterLevel: response.questSpecificBuffs.minusMonsterLevel.length,
    frostyEffect: response.questSpecificBuffs.frostyEffect.length,
    flatWeaponDamage: response.questSpecificBuffs.flatWeaponDamage.length,
    weaponDamagePercent: response.questSpecificBuffs.weaponDamagePercent.length,
    flatSpellDamage: response.questSpecificBuffs.flatSpellDamage.length,
    spellDamagePercent: response.questSpecificBuffs.spellDamagePercent.length,
    superSkill: response.survivalBuffs.superSkill.length,
    odeToBooze: response.survivalBuffs.odeToBooze.length,
    frosty: response.survivalBuffs.frosty.length,
    inigos: response.survivalBuffs.inigos.length,
    damageAbsorption: response.survivalBuffs.damageAbsorption.length,
    mpRegen: response.survivalBuffs.mpRegen.length,
  };

  return response;
}
