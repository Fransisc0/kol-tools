import { describe, expect, it } from 'vitest';
import { createBaseItem, parseEffectMetadata } from './itemNormalization';

describe('server item normalization', () => {
  it('resolves decoded effect metadata and modifier values', () => {
    const modifiers = new Map([['rave concentration', 'Item Drop: +30']]);
    expect(parseEffectMetadata('Effect: "Rave Concentration", Effect Duration: 48', modifiers)).toEqual({
      effectName: 'Rave Concentration',
      effectDuration: 48,
      effectModifiers: 'Item Drop: +30',
    });
  });

  it('marks renamed Familiar-only data unchanged while decoding names', () => {
    const item = createBaseItem({
      id: 1,
      originalName: 'Ben-Gal&trade; Balm',
      transformedName: 'friendly Ben-Gal&trade; Balm',
      size: 0,
      quality: '',
      primaryUse: 'familiar',
      isPotion: false,
      isMonsterManualPotion: false,
      zones: [],
      isEquipment: true,
      isCafe: false,
      effect: { effectModifiers: '' },
      itemModifiers: 'Familiar Effect: "atk, cap 5"',
      tags: ['Drops / Other'],
      sourceDetails: [],
    });

    expect(item.origName).toBe('Ben-Gal™ Balm');
    expect(item.tcrsName).toBe('friendly Ben-Gal™ Balm');
    expect(item.isUnchanged).toBe(true);
  });
});
