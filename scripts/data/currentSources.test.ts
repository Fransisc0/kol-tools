import { describe, expect, it } from 'vitest';

import { canonicalizeSource, sourceFingerprint } from './currentSources';

describe('approved input normalization', () => {
  const utf8 = (text: string) => new TextEncoder().encode(text);

  it('fingerprints LF and Windows CRLF checkouts identically without sorting file content', () => {
    const lf = canonicalizeSource(utf8('one\ntwo\n'));
    const crlf = canonicalizeSource(utf8('one\r\ntwo\r\n'));
    expect(crlf).toEqual(lf);
    expect(canonicalizeSource(utf8('two\none\n'))).not.toEqual(lf);
    expect(sourceFingerprint([{ path: 'b', sha256: '2' }, { path: 'a', sha256: '1' }])).toBe(
      sourceFingerprint([{ path: 'a', sha256: '1' }, { path: 'b', sha256: '2' }]),
    );
  });

  it('rejects malformed UTF-8 and NUL bytes rather than replacing them', () => {
    expect(() => canonicalizeSource(Uint8Array.of(0xff))).toThrow();
    expect(() => canonicalizeSource(utf8('item\0name'))).toThrow('NUL byte');
  });
});
