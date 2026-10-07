/**
 * In-memory sliding-window limiter. Fine for a single Node process.
 * On serverless / multi-instance deployments each instance keeps its own counters,
 * so swap this for a shared store (e.g. Upstash Redis) behind the same signature.
 */
const store = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    store.set(key, hits);
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }

  hits.push(now);
  store.set(key, hits);
  if (store.size > MAX_KEYS) prune(cutoff);
  return { ok: true, remaining: limit - hits.length, retryAfter: 0 };
}

function prune(cutoff: number) {
  for (const [k, v] of store) {
    if (!v.length || v[v.length - 1] <= cutoff) store.delete(k);
  }
  if (store.size > MAX_KEYS) {
    let over = store.size - MAX_KEYS;
    for (const k of store.keys()) {
      if (over-- <= 0) break;
      store.delete(k);
    }
  }
}
