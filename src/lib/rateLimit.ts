/**
 * Minimal fixed-window rate limiter, in-memory. Good enough for a single
 * server instance. If you deploy multiple instances behind a load
 * balancer, swap this for a shared store (Redis `INCR` + `EXPIRE`) so
 * limits are enforced across instances instead of per-process.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}
