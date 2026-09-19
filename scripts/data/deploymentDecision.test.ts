import { describe, expect, it } from 'vitest';

import { shouldDeployPages } from './deploymentDecision';

describe('scheduled Pages deployment decisions', () => {
  it('skips only an unchanged scheduled data deployment', () => {
    expect(shouldDeployPages('schedule', 'same', 'same')).toBe(false);
    expect(shouldDeployPages('schedule', 'new', 'old')).toBe(true);
    expect(shouldDeployPages('schedule', 'new', undefined)).toBe(true);
  });

  it('always publishes application changes and manual deployments', () => {
    expect(shouldDeployPages('push', 'same', 'same')).toBe(true);
    expect(shouldDeployPages('workflow_dispatch', 'same', 'same')).toBe(true);
  });
});
