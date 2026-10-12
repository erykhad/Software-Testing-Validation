export type RateBucket = {
  count: number;
  resetAt: number;
};

export function consumeRateLimit(
  buckets: Map<string, RateBucket>,
  key: string,
  now: number,
  max: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (current.count >= max) {
    return { allowed: false, remaining: 0 };
  }
  current.count += 1;
  return { allowed: true, remaining: max - current.count };
}
