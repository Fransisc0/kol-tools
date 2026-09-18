import { describe, expect, it } from 'vitest';
import { DEFAULT_BOOZE_QUALITY_FILTER } from '../types';
import { normalizeBoozeQualityFilter } from './usePreferences';

describe('booze quality preferences', () => {
  it('accepts both supported saved values', () => {
    expect(normalizeBoozeQualityFilter('epic')).toBe('epic');
    expect(normalizeBoozeQualityFilter('all')).toBe('all');
  });

  it('falls back to EPIC for missing or invalid saved values', () => {
    expect(normalizeBoozeQualityFilter(null)).toBe(DEFAULT_BOOZE_QUALITY_FILTER);
    expect(normalizeBoozeQualityFilter('awesome')).toBe(DEFAULT_BOOZE_QUALITY_FILTER);
  });
});
