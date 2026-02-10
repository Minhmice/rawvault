/**
 * Basic in-memory rate limiter for sign and share endpoints.
 * Per security-audit: rate limit sign and share.
 * MVP: simple sliding window; production should use Redis.
 */

const store = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 min
const MAX_REQUESTS_SIGN = 30;
const MAX_REQUESTS_SHARE = 20;

function cleanup(key: string, now: number) {
  const timestamps = store.get(key) ?? [];
  const filtered = timestamps.filter((t) => now - t < WINDOW_MS);
  if (filtered.length === 0) store.delete(key);
  else store.set(key, filtered);
}

export function checkRateLimit(
  key: string,
  maxRequests: number
): { ok: boolean } {
  const now = Date.now();
  cleanup(key, now);
  const timestamps = store.get(key) ?? [];
  if (timestamps.length >= maxRequests) return { ok: false };
  timestamps.push(now);
  store.set(key, timestamps);
  return { ok: true };
}

export function rateLimitSign(identifier: string): { ok: boolean } {
  return checkRateLimit(`sign:${identifier}`, MAX_REQUESTS_SIGN);
}

export function rateLimitShare(identifier: string): { ok: boolean } {
  return checkRateLimit(`share:${identifier}`, MAX_REQUESTS_SHARE);
}
