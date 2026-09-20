import type { TCRSDataResponse } from '../../../types';
import { applyGeneralBuffRules } from '../categories/generalBuffs';
import { applyQuestBuffRules } from '../categories/questBuffs';
import { applySurvivalBuffRules } from '../categories/survivalBuffs';
import { applyTurnGenerationRules } from '../categories/turnGeneration';
import { getMonsterManualEntry } from '../../../data/monsterManualData';
import { createBaseItem, isEquipmentUse, isPotionUse, parseEffectMetadata } from './itemNormalization';
import { createEmptyResponse } from './responseFactory';
import { getItemSourceEnrichment } from './itemEnrichment';
import type { ReferenceData } from './referenceData';
import { finalizeResponse } from './responseFinalizer';
import type { TCRSRecordSet } from './tcrsRecords';

export function parseTCRSRecords(
  className: string,
  moonSign: string,
  records: TCRSRecordSet,
  referenceData: ReferenceData,
): TCRSDataResponse {
  const normClass = className.replace(/\s+/g, '_');
  const normSign = moonSign.replace(/\s+/g, '_');

  const response = createEmptyResponse(normClass, normSign);

  const filesToRead = [
    {
      content: records.main,
      isCafe: false,
      forcedType: '',
    },
    {
      content: records.cafeFood,
      isCafe: true,
      forcedType: 'food',
    },
    {
      content: records.cafeBooze,
      isCafe: true,
      forcedType: 'drink',
    },
  ];

  const seenAllItemIds = new Set<number>();

  for (const { content, isCafe, forcedType } of filesToRead) {
    for (const [id, tcrsName, size, quality, itemModifiers] of content) {
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

      const itemZones = referenceData.itemZones[origMeta.name.toLowerCase()] ?? [];

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

      const categoryContext = {
        response,
        baseItem,
        combined,
        quality,
        primaryUse,
        forcedType,
        size,
        isPotion,
        effectName,
        effectDuration,
      };
      applyTurnGenerationRules(categoryContext);
      applyGeneralBuffRules(categoryContext);
      applyQuestBuffRules(categoryContext);
      applySurvivalBuffRules(categoryContext);
    }
  }

  return finalizeResponse(response);
}
