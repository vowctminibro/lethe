/**
 * Soft per-address rate limit for LLM routes — judge-proofing, not security.
 *
 * Simple token bucket kept in module memory. KNOWN LIMITATION: on serverless
 * (Vercel) each warm instance has its own bucket, so the real ceiling is
 * N_instances × capacity — acceptable for a hackathon demo where the goal is
 * stopping a runaway tab or a copied curl loop, not adversaries. A durable
 * limiter (KV/upstash) is a one-file swap later.
 *
 * ONLY the LLM plane is limited. Memory routes (view/derive/grant/revoke/
 * export/store/recall) are never rate-limited — owning your memory must not
 * depend on a quota.
 */

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

const CAPACITY = 20; // burst
const REFILL_PER_MIN = 6; // sustained: ~1 message / 10s
const buckets = new Map<string, Bucket>();

/** Take one token for `key` (an address or IP). True = allowed. */
export function takeToken(key: string): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: CAPACITY, lastRefillMs: now };
    buckets.set(key, b);
  }
  const elapsedMin = (now - b.lastRefillMs) / 60_000;
  b.tokens = Math.min(CAPACITY, b.tokens + elapsedMin * REFILL_PER_MIN);
  b.lastRefillMs = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  // Unbounded growth guard: drop stale buckets once in a while.
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) {
      if (now - v.lastRefillMs > 60 * 60_000) buckets.delete(k);
    }
  }
  return true;
}
