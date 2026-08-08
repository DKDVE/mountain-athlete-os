import { describe, expect, it } from 'vitest';
import { isUlid, ulid } from './ulid.js';

describe('ulid', () => {
  it('generates 26-char Crockford base32 strings', () => {
    const id = ulid();
    expect(id.length).toBe(26);
    expect(isUlid(id)).toBe(true);
  });

  it('is deterministic when seed time is provided', () => {
    const a = ulid(1_700_000_000_000);
    const b = ulid(1_700_000_000_000);
    expect(a.slice(0, 10)).toBe(b.slice(0, 10));
  });

  it('rejects invalid strings', () => {
    expect(isUlid('')).toBe(false);
    expect(isUlid('invalid')).toBe(false);
    expect(isUlid('I')).toBe(false);
  });
});
