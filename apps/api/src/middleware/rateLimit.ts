import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../app.js';
import { consumeRateLimit, type RateBucket } from '../domain/rateLimit.js';

export function createLoginRateLimit(max: number, windowMs: number): MiddlewareHandler<AppEnv> {
  const buckets = new Map<string, RateBucket>();
  return async (c, next) => {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const key = forwarded || 'local';
    const result = consumeRateLimit(buckets, key, Date.now(), max, windowMs);
    if (!result.allowed) {
      return c.json({ error: 'Zbyt wiele prób logowania. Spróbuj ponownie później.' }, 429);
    }
    await next();
  };
}
