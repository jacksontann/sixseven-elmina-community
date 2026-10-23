/**
 * In-memory token bucket per key (actor + action). Good enough for a single-process prototype; a
 * multi-instance deployment needs a shared store (spec 20.4). Exceeding the bucket returns RATE_LIMITED.
 */
const buckets = new Map<string, { tokens: number; updatedAt: number }>();

export function takeToken(key: string, capacity = 12, refillPerSecond = 0.5): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  bucket.tokens = Math.min(capacity, bucket.tokens + ((now - bucket.updatedAt) / 1000) * refillPerSecond);
  bucket.updatedAt = now;
  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;
  buckets.set(key, bucket);
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (now - b.updatedAt > 3_600_000) buckets.delete(k);
  }
  return allowed;
}
