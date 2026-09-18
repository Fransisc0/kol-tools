import { afterEach, describe, expect, it } from 'vitest';
import { getItemSourceEnrichment } from './itemEnrichment';
import { clearReferenceDataCache, loadReferenceData, normalizeLookupName } from './referenceData';

describe('reference data', () => {
  afterEach(clearReferenceDataCache);

  it('loads the bundled item and effect indexes', () => {
    const data = loadReferenceData();
    expect(data.items.size).toBeGreaterThan(10_000);
    expect(data.effectModifiers.size).toBeGreaterThan(1_000);
    expect(data.npcStores.size).toBeGreaterThan(100);
    expect(data.craftMethods.size).toBeGreaterThan(100);
  });

  it('normalizes entities consistently for source enrichment', () => {
    expect(normalizeLookupName('Ben-Gal&trade; Balm')).toBe('ben-gal™ balm');
    const enrichment = getItemSourceEnrichment('worthless trinket', loadReferenceData());
    expect(enrichment.tags).toContain('NPC Store');
    expect(enrichment.sourceDetails).toContain('The Hermit');
  });
});
