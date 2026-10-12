import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppContext } from '../context.js';
import type { AppEnv } from '../app.js';

export function loadUser(ctx: AppContext): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set('user', null);
    const token = getCookie(c, 'session');
    if (token) {
      const session = ctx.sessions.findValid(token, new Date().toISOString());
      if (session) c.set('user', session.user);
    }
    await next();
  };
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Wymagane logowanie' }, 401);
  }
  await next();
};
