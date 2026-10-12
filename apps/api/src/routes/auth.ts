import type { Hono } from 'hono';
import { loginSchema, registerSchema } from '../domain/schemas.js';
import { attachSession, clearSession, jsonBody, sessionToken } from '../http.js';
import type { AppEnv } from '../app.js';
import { createLoginRateLimit } from '../middleware/rateLimit.js';
import { createAuthService } from '../services/auth.js';
import type { AppContext } from '../context.js';

export function registerAuthRoutes(
  app: Hono<AppEnv>,
  ctx: AppContext,
  options: { secureCookies: boolean; bcryptRounds: number; rateLimitMax: number; rateLimitWindowMs: number },
) {
  const auth = createAuthService(ctx, options.bcryptRounds);
  const limit = createLoginRateLimit(options.rateLimitMax, options.rateLimitWindowMs);

  app.post('/api/auth/register', async (c) => {
    const body = jsonBody(registerSchema, await c.req.json().catch(() => null));
    const result = auth.register(body);
    attachSession(c, result.token, options.secureCookies);
    return c.json({ user: result.user }, 201);
  });

  app.post('/api/auth/login', limit, async (c) => {
    const body = jsonBody(loginSchema, await c.req.json().catch(() => null));
    const result = auth.login(body);
    attachSession(c, result.token, options.secureCookies);
    return c.json({ user: result.user });
  });

  app.post('/api/auth/logout', (c) => {
    auth.logout(sessionToken(c));
    clearSession(c, options.secureCookies);
    return c.body(null, 204);
  });

  app.get('/api/auth/me', (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Wymagane logowanie' }, 401);
    return c.json({ user });
  });
}
