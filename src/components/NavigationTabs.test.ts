import { describe, expect, it } from 'vitest';
import { PURPOSE_OPTIONS } from './NavigationTabs';

describe('purpose navigation', () => {
  it('combines all buff purposes into one selector', () => {
    expect(Object.keys(PURPOSE_OPTIONS)).toEqual(['turn-generation', 'buffs']);
    expect(PURPOSE_OPTIONS.buffs).toEqual(
      expect.arrayContaining([
        { id: 'monsterLevel', label: '+ Monster Level' },
        { id: 'minusMonsterLevel', label: '- Monster Level' },
        { id: 'damageAbsorption', label: 'Damage Absorption' },
      ]),
    );
  });

  it('does not expose Super Structure', () => {
    expect(PURPOSE_OPTIONS.buffs.some((option) => option.id === 'superSkill')).toBe(false);
  });
});
