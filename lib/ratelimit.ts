/**
 * Simple sliding-window rate limiter backed by an in-memory Map.
 *
 * Good enough for a single-instance deployment (local dev, small VPS).
 * For Vercel/multi-instance production, swap the store for Upstash Redis:
 *   https://github.com/upstash/ratelimit
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Prune expired entries every 5 minutes to avoid memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store) {
      if (now > record.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Returns `{ allowed: true }` when the request can proceed,
 * or `{ allowed: false, retryAfterMs }` when the limit is exceeded.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true };
}

/** Convenience: derive a key from an IP address + optional route tag. */
export function ipKey(ip: string, tag = ""): string {
  return tag ? `${tag}:${ip}` : ip;
}

/** Best-effort IP extraction from a Next.js request. */
export function getClientIp(request: Request): string {
  const headers = request instanceof Request ? request.headers : new Headers();
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
