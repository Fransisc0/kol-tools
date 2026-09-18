import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TCRSItem } from '../types';
import { getItemDisplayModel } from '../utils/itemDisplay';
import { ItemIdentity } from './ItemIdentity';

function item(overrides: Partial<TCRSItem> = {}): TCRSItem {
  return {
    id: 2595,
    origName: 'Ben-Gal Balm',
    tcrsName: 'corrupted Ben-Gal Balm',
    size: 0,
    quality: '',
    primaryUse: 'usable',
    isPotion: false,
    isEquipment: false,
    isCafe: false,
    itemModifiers: '',
    extractedNumericBonus: 0,
    tags: ['Drops / Other'],
    sourceDetails: [],
    ...overrides,
  };
}

describe('ItemIdentity', () => {
  it('renders the original name before the labeled TCRS name', () => {
    const value = item();
    const html = renderToStaticMarkup(
      <ItemIdentity item={value} display={getItemDisplayModel(value)} variant="row" />,
    );
    expect(html.indexOf('Ben-Gal Balm')).toBeLessThan(html.indexOf('TCRS'));
    expect(html).toContain('corrupted Ben-Gal Balm');
  });

  it('uses the unchanged treatment instead of repeating an identical name', () => {
    const value = item({ tcrsName: 'Ben-Gal Balm' });
    const html = renderToStaticMarkup(
      <ItemIdentity item={value} display={getItemDisplayModel(value)} variant="row" />,
    );
    expect(html).toContain('Unchanged');
    expect(html.match(/Ben-Gal Balm/g)).toHaveLength(2); // visible text plus title attribute
  });
});
