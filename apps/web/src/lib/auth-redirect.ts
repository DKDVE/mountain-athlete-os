/**
 * ponytail: exact redirect URLs only — must match Supabase Auth URL config (no wildcards).
 * Comma-separated full URLs including trailing slash.
 */
const DEFAULT_DEV_REDIRECTS = [
  'http://localhost:5173/mountain-athlete-os/',
  'http://127.0.0.1:5173/mountain-athlete-os/',
];

function parseAllowlist(): string[] {
  const raw = import.meta.env.VITE_AUTH_REDIRECT_URLS;
  if (!raw) return DEFAULT_DEV_REDIRECTS;
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function allowedAuthRedirectUrls(): readonly string[] {
  return parseAllowlist();
}

export function authRedirectUrl(): string {
  const allowlist = parseAllowlist();
  const base = import.meta.env.VITE_APP_BASE_PATH || '/';
  const path = base === '/' ? '/' : `${base.replace(/\/$/, '')}/`;
  const candidate = `${window.location.origin}${path}`;

  if (!allowlist.includes(candidate)) {
    throw new Error(
      `Auth redirect blocked: ${candidate} is not in VITE_AUTH_REDIRECT_URLS allowlist`,
    );
  }

  return candidate;
}
