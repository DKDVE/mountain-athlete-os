import { describe, expect, it } from 'vitest';
import { allowedAuthRedirectUrls, authRedirectUrl } from '@/lib/auth-redirect';

describe('authRedirectUrl', () => {
  it('allowlist contains only exact URLs (no wildcards)', () => {
    const urls = allowedAuthRedirectUrls();
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).not.toMatch(/\*/);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('returns allowlisted URL for current origin', () => {
    const allowlisted = 'http://localhost:5173/mountain-athlete-os/';
    Object.defineProperty(window, 'location', {
      value: new URL(allowlisted),
      writable: true,
    });
    expect(authRedirectUrl()).toBe(allowlisted);
  });

  it('rejects non-allowlisted origin', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://evil.example/mountain-athlete-os/'),
      writable: true,
    });
    expect(() => authRedirectUrl()).toThrow(/not in VITE_AUTH_REDIRECT_URLS allowlist/);
  });
});
