import type { CategoryRuleContext } from './types';

export function applyTurnGenerationRules(context: CategoryRuleContext): void {
  const { response, baseItem, combined, quality, primaryUse, forcedType, size } = context;
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
}
