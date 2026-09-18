import { describe, expect, it } from 'vitest';
import { TCRSItem } from '../types';
import { getItemDisplayModel, parseEffectModifiers, summarizeEffectModifiers } from './itemDisplay';

function item(overrides: Partial<TCRSItem> = {}): TCRSItem {
  return {
    id: 1,
    origName: 'Original item',
    tcrsName: 'transformed item',
    size: 0,
    quality: '',
    primaryUse: 'usable',
    isPotion: false,
    isEquipment: false,
    isCafe: false,
    itemModifiers: '',
    extractedNumericBonus: 0,
    tags: ['Drops / Other'],
    sourceDetails: ['A source'],
    ...overrides,
  };
}

describe('getItemDisplayModel', () => {
  it('identifies unchanged names without repeating them', () => {
    expect(getItemDisplayModel(item({ tcrsName: 'Original item' })).isNameUnchanged).toBe(true);
  });

  it('suppresses consumable summaries already represented by badges', () => {
    const display = getItemDisplayModel(
      item({
        quality: 'EPIC',
        size: 1,
        primaryUse: 'food',
        extractedStat: 'EPIC Food (Size 1)',
        extractedBonus: 'EPIC (Size 1)',
      }),
    );
    expect(display.primaryResult).toBeUndefined();
  });

  it('prefers a formatted effect over an extracted stat', () => {
    const display = getItemDisplayModel(
      item({
        effectName: 'Useful Effect',
        effectDuration: 15,
        extractedStat: 'Effect: Useful Effect, Effect Duration: 15, Item Drop: +20',
      }),
    );
    expect(display.primaryResult).toMatchObject({
      kind: 'effect',
      label: 'Useful Effect',
      duration: 15,
      modifierSummary: '',
      accessibleText: 'Useful Effect, 15 turns',
    });
  });

  it('shows the Rave Concentration modifier inline', () => {
    const display = getItemDisplayModel(
      item({
        effectName: 'Rave Concentration',
        effectDuration: 48,
        effectModifiers: 'Item Drop: +30',
      }),
    );
    expect(display.primaryResult?.modifierSummary).toBe('Item Drop +30');
    expect(display.primaryResult?.accessibleText).toBe('Rave Concentration, Item Drop: +30, 48 turns');
  });

  it('summarizes two modifiers and reports additional values', () => {
    const tokens = parseEffectModifiers('Hot Damage: +20, Cold Damage: +20, Stench Damage: +20');
    expect(summarizeEffectModifiers(tokens)).toBe('Hot Damage +20 · Cold Damage +20 · +1 more');
  });

  it('preserves formulas and excludes generic Familiar Effect summaries', () => {
    const tokens = parseEffectModifiers('Item Drop: [(+25-D)*env(underwater)], Familiar Effect: "atk"');
    expect(tokens).toEqual([
      {
        label: 'Item Drop',
        value: '[(+25-D)*env(underwater)]',
        raw: 'Item Drop: [(+25-D)*env(underwater)]',
      },
    ]);
  });

  it('suppresses structural all-items summaries', () => {
    const display = getItemDisplayModel(
      item({
        itemModifiers: 'Wiki Name: "water wings"',
        extractedStat: 'Wiki Name: "water wings"',
      }),
    );
    expect(display.primaryResult).toBeUndefined();
  });

  it('does not repeat an extracted value when the label already contains it', () => {
    const display = getItemDisplayModel(
      item({
        extractedStat: '+30 Monster Level',
        extractedBonus: '+30 ML',
      }),
    );
    expect(display.primaryResult).toMatchObject({
      kind: 'stat',
      label: '+30 Monster Level',
      value: undefined,
    });
  });

  it('deduplicates effect modifiers from item modifiers and sources', () => {
    const display = getItemDisplayModel(
      item({
        effectModifiers: 'Item Drop: +20, Meat Drop: +10',
        itemModifiers: 'Effect: "Useful Effect", Effect Duration: 15, Item Drop: +20, Muscle: +5',
        sourceDetails: ['Store A', 'Store A'],
      }),
    );
    expect(display.itemModifiers).toBe('Muscle: +5');
    expect(display.sources).toEqual(['Store A']);
  });
});
