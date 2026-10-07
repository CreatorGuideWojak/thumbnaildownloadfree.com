/**
 * Tiny in-memory TTL cache to avoid re-probing the same YouTube video on every
 * request. Per-process only — fine for a single instance; on serverless each
 * instance keeps its own cache, which is safe (just less effective).
 */
export function makeTtlCache<V>(ttlMs: number, maxEntries = 500) {
  const store = new Map<string, { value: V; expires: number }>();

  return {
    get(key: string): V | undefined {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key: string, value: V) {
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      }
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}
