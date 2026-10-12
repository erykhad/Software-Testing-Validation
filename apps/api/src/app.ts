import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import type { Database } from 'better-sqlite3';
import { createContext } from './context.js';
import { HttpError } from './errors.js';
import { loadUser } from './middleware/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerItemRoutes } from './routes/items.js';
import { registerListRoutes } from './routes/lists.js';
import type { SessionUser } from './repositories/sessions.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type AppEnv = {
  Variables: {
    user: SessionUser | null;
  };
};

export type AppOptions = {
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  secureCookies?: boolean;
  bcryptRounds?: number;
};

export function createApp(db: Database, options: AppOptions = {}) {
  const resolved = {
    rateLimitMax: options.rateLimitMax ?? 10,
    rateLimitWindowMs: options.rateLimitWindowMs ?? 60_000,
    secureCookies: options.secureCookies ?? false,
    bcryptRounds: options.bcryptRounds ?? 10,
  };
  const ctx = createContext(db);
  const app = new Hono<AppEnv>();

  app.use('*', secureHeaders());
  app.use(
    '*',
    bodyLimit({
      maxSize: 3 * 1024 * 1024,
      onError: (c) => c.json({ error: 'Żądanie jest zbyt duże' }, 413),
    }),
  );
  app.use('*', loadUser(ctx));

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.json({ error: error.message }, error.status as ContentfulStatusCode);
    }
    console.error(error);
    return c.json({ error: 'Wewnętrzny błąd serwera' }, 500);
  });

  app.get('/api/health', (c) => c.json({ ok: true }));
  registerAuthRoutes(app, ctx, resolved);
  registerListRoutes(app, ctx);
  registerItemRoutes(app, ctx);
  registerCatalogRoutes(app, ctx);
  app.notFound((c) => c.json({ error: 'Nie znaleziono' }, 404));

  return app;
}
