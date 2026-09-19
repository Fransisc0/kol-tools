import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TCRSDataManifest } from '../features/tcrs/data/dataManifest';
import { DataVersionStatus } from './DataVersionStatus';

const manifest: TCRSDataManifest = {
  version: 2,
  source: {
    repository: 'kolmafia/kolmafia',
    revision: 'a'.repeat(40),
    committedAt: '2026-09-18T12:00:00.000Z',
  },
  dataFingerprint: 'b'.repeat(64),
  combinations: [],
  files: [],
  referenceIndex: { path: 'reference-data.json', bytes: 1, sha256: 'c'.repeat(64) },
  sourceFiles: [],
};

describe('DataVersionStatus', () => {
  it('links a compact date to the exact sanitized source revision', () => {
    const html = renderToStaticMarkup(<DataVersionStatus manifest={manifest} />);
    expect(html).toContain('KoLmafia data · Sep 18, 2026');
    expect(html).toContain(`https://github.com/kolmafia/kolmafia/commit/${'a'.repeat(40)}`);
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
