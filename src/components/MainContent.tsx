import React, { useMemo, useEffect } from 'react';
import { TCRSDataResponse, TCRSItem } from '../types';
import { GroupedItemList } from './GroupedItemList';
import { ItemList, ItemTypeKey, FoodQualityFilter } from './ItemList';
import { getSubCategoryTabs } from './NavigationTabs';
import { ItemLayout } from '../hooks/usePreferences';

interface MainContentProps {
  data: TCRSDataResponse | null;
  groupingMode: string;
  activeSubCategory: string;
  setActiveSubCategory: (val: string) => void;
  activeSection: string;
  allowedTags: Record<string, boolean>;
  setAllowedTags?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allowedTypes: Record<ItemTypeKey, boolean>;
  setAllowedTypes?: React.Dispatch<React.SetStateAction<Record<ItemTypeKey, boolean>>>;
  showUnchangedItems?: boolean;
  foodQualityFilter: FoodQualityFilter;
  setFoodQualityFilter: (val: FoodQualityFilter) => void;
  itemLayout?: ItemLayout;
  setItemLayout?: (layout: ItemLayout) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export function MainContent({
  data,
  groupingMode,
  activeSubCategory,
  setActiveSubCategory,
  activeSection,
  allowedTags,
  setAllowedTags,
  allowedTypes,
  setAllowedTypes,
  showUnchangedItems,
  foodQualityFilter,
  setFoodQualityFilter,
  itemLayout,
  setItemLayout,
  onOpenFilters,
  activeFilterCount,
}: MainContentProps) {
  const subCategoryTabs = useMemo(
    () => getSubCategoryTabs(data, groupingMode, activeSection),
    [data, groupingMode, activeSection],
  );

  useEffect(() => {
    if (subCategoryTabs.length > 0 && !subCategoryTabs.some((t) => t.id === activeSubCategory)) {
      setActiveSubCategory(subCategoryTabs[0].id);
    }
  }, [subCategoryTabs, activeSubCategory, setActiveSubCategory]);

  if (!data) return null;

  if (groupingMode !== 'Purpose') {
    return (
      <GroupedItemList
        data={data}
        mode={groupingMode as 'NPC Store' | 'Zone' | 'All'}
        activeSection={activeSection}
        activeSubCategory={activeSubCategory}
        allowedTags={allowedTags}
        setAllowedTags={setAllowedTags}
        allowedTypes={allowedTypes}
        setAllowedTypes={setAllowedTypes}
        showUnchangedItems={showUnchangedItems}
        foodQualityFilter={foodQualityFilter}
        setFoodQualityFilter={setFoodQualityFilter}
        subCategoryTabs={subCategoryTabs}
        onSelectSubCategory={setActiveSubCategory}
        itemLayout={itemLayout}
        setItemLayout={setItemLayout}
        onOpenFilters={onOpenFilters}
        activeFilterCount={activeFilterCount}
      />
    );
  }

  const renderList = (title: string, items: TCRSItem[], id: string) => (
    <ItemList
      title={title}
      subtitle=""
      items={items}
      allowedTags={allowedTags}
      setAllowedTags={setAllowedTags}
      allowedTypes={allowedTypes}
      setAllowedTypes={setAllowedTypes}
      showUnchangedItems={showUnchangedItems}
      foodQualityFilter={foodQualityFilter}
      setFoodQualityFilter={setFoodQualityFilter}
      categoryKey={id}
      subCategoryTabs={subCategoryTabs}
      subCategoryLabel="Purpose"
      subCategoryAllOptionLabel="All purposes"
      subCategoryIncludeAll={false}
      activeSubCategory={activeSubCategory}
      onSelectSubCategory={setActiveSubCategory}
      itemLayout={itemLayout}
      setItemLayout={setItemLayout}
      onOpenFilters={onOpenFilters}
      activeFilterCount={activeFilterCount}
    />
  );

  switch (activeSubCategory) {
    // -- Turn Generation --
    case 'food':
      return renderList('Food', data.turnGeneration.food, 'food');
    case 'booze':
      return renderList('Booze', data.turnGeneration.booze, 'booze');
    case 'rolloverAdventures':
      return renderList('Rollover Adventures', data.turnGeneration.rolloverAdventures, 'rolloverAdventures');
    case 'odeToBooze':
      return renderList(
        'The Ode to Booze',
        data.turnGeneration.odeToBooze || data.survivalBuffs?.odeToBooze || [],
        'odeToBooze',
      );
    case 'garish':
      return renderList('Gar-ish', data.turnGeneration.garish || [], 'garish');

    // -- General Quest Buffs --
    case 'noncombat':
      return renderList('Noncombat', data.generalQuestBuffs.noncombat, 'noncombat');
    case 'combat':
      return renderList('Combat', data.generalQuestBuffs.combat, 'combat');
    case 'monsterLevel':
      return renderList('Monster Level', data.generalQuestBuffs.monsterLevel || [], 'monsterLevel');
    case 'normalItemDrop':
      return renderList('+Item% drops', data.generalQuestBuffs.normalItemDrop, 'normalItemDrop');
    case 'foodDrop':
      return renderList('+Food% drops', data.generalQuestBuffs.foodDrop, 'foodDrop');
    case 'boozeDrop':
      return renderList('+Booze% drops', data.generalQuestBuffs.boozeDrop, 'boozeDrop');
    case 'meatDrop':
      return renderList('Meat%', data.generalQuestBuffs.meatDrop, 'meatDrop');
    case 'statGainsBasic':
      return renderList('Flat + stat gains/fight', data.generalQuestBuffs.statGainsBasic, 'statGainsBasic');
    case 'statGainsMus':
      return renderList('+Mus% gains', data.generalQuestBuffs.statGainsMus, 'statGainsMus');
    case 'statGainsMys':
      return renderList('+Mys% gains', data.generalQuestBuffs.statGainsMys, 'statGainsMys');
    case 'statGainsMox':
      return renderList('+Mox% gains', data.generalQuestBuffs.statGainsMox, 'statGainsMox');
    case 'familiarWeight':
      return renderList('Familiar Weight', data.generalQuestBuffs.familiarWeight, 'familiarWeight');
    case 'familiarExp':
      return renderList('Familiar Experience', data.generalQuestBuffs.familiarExp, 'familiarExp');
    case 'initiative':
      return renderList('Initiative%', data.generalQuestBuffs.initiative, 'initiative');

    // -- Quest Specific Buffs --
    case 'minusMonsterLevel':
      return renderList('- Monster Level', data.questSpecificBuffs.minusMonsterLevel, 'minusMonsterLevel');
    case 'frostyEffect':
      return renderList('Frosty Effect', data.questSpecificBuffs.frostyEffect || [], 'frostyEffect');
    case 'flatWeaponDamage':
      return renderList('Weapon Damage', data.questSpecificBuffs.flatWeaponDamage || [], 'flatWeaponDamage');
    case 'weaponDamagePercent':
      return renderList(
        'Weapon Damage %',
        data.questSpecificBuffs.weaponDamagePercent || [],
        'weaponDamagePercent',
      );
    case 'flatSpellDamage':
      return renderList('Spell Damage', data.questSpecificBuffs.flatSpellDamage || [], 'flatSpellDamage');
    case 'spellDamagePercent':
      return renderList(
        'Spell Damage %',
        data.questSpecificBuffs.spellDamagePercent || [],
        'spellDamagePercent',
      );
    case 'resCold':
      return renderList('Cold Resistance', data.questSpecificBuffs.resCold, 'resCold');
    case 'resHot':
      return renderList('Hot Resistance', data.questSpecificBuffs.resHot, 'resHot');
    case 'resStench':
      return renderList('Stench Resistance', data.questSpecificBuffs.resStench, 'resStench');
    case 'resSpooky':
      return renderList('Spooky Resistance', data.questSpecificBuffs.resSpooky, 'resSpooky');
    case 'resSleaze':
      return renderList('Sleaze Resistance', data.questSpecificBuffs.resSleaze, 'resSleaze');
    case 'dmgCold':
      return renderList('Cold Dmg / Spell Dmg', data.questSpecificBuffs.dmgCold || [], 'dmgCold');
    case 'dmgHot':
      return renderList('Hot Dmg / Spell Dmg', data.questSpecificBuffs.dmgHot || [], 'dmgHot');
    case 'dmgStench':
      return renderList('Stench Dmg / Spell Dmg', data.questSpecificBuffs.dmgStench || [], 'dmgStench');
    case 'dmgSpooky':
      return renderList('Spooky Dmg / Spell Dmg', data.questSpecificBuffs.dmgSpooky || [], 'dmgSpooky');
    case 'dmgSleaze':
      return renderList('Sleaze Dmg / Spell Dmg', data.questSpecificBuffs.dmgSleaze || [], 'dmgSleaze');

    // -- Survival Buffs --
    case 'inigos':
      return renderList("Inigo's", data.survivalBuffs.inigos || [], 'inigos');
    case 'frosty':
      return renderList('Frosty', data.survivalBuffs.frosty || [], 'frosty');
    case 'flatMuscle':
      return renderList('+Muscle', data.survivalBuffs.flatMuscle || [], 'flatMuscle');
    case 'flatMysticality':
      return renderList('+Mysticality', data.survivalBuffs.flatMysticality || [], 'flatMysticality');
    case 'flatMoxie':
      return renderList('+Moxie', data.survivalBuffs.flatMoxie || [], 'flatMoxie');
    case 'musclePercent':
      return renderList('+Muscle%', data.survivalBuffs.musclePercent || [], 'musclePercent');
    case 'mysticalityPercent':
      return renderList('+Mysticality%', data.survivalBuffs.mysticalityPercent || [], 'mysticalityPercent');
    case 'moxiePercent':
      return renderList('+Moxie%', data.survivalBuffs.moxiePercent || [], 'moxiePercent');
    case 'damageAbsorption':
      return renderList('Damage Absorption', data.survivalBuffs.damageAbsorption || [], 'damageAbsorption');
    case 'mpRegen':
      return renderList('MP regeneration', data.survivalBuffs.mpRegen || [], 'mpRegen');

    default: {
      if (data.turnGeneration?.food?.length) {
        return renderList('Food', data.turnGeneration.food, 'food');
      }
      return (
        <div className="p-8 text-center text-slate-400 italic">Select a category above to view items.</div>
      );
    }
  }
}
