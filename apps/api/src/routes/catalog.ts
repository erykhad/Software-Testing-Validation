import type { Hono } from 'hono';
import type { AppContext } from '../context.js';
import { UNITS } from '../domain/units.js';
import { requireAuth } from '../middleware/auth.js';
import type { AppEnv } from '../app.js';

export function registerCatalogRoutes(app: Hono<AppEnv>, ctx: AppContext) {
  app.use('/api/popular-products', requireAuth);
  app.use('/api/units', requireAuth);

  app.get('/api/popular-products', (c) => {
    return c.json({ products: ctx.products.all() });
  });

  app.get('/api/units', (c) => {
    return c.json({ units: UNITS });
  });
}
