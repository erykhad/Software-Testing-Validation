import type { Hono } from 'hono';
import type { AppContext } from '../context.js';
import { itemSchema, statusSchema } from '../domain/schemas.js';
import { currentUser, jsonBody } from '../http.js';
import { requireAuth } from '../middleware/auth.js';
import { createItemService } from '../services/items.js';
import { readItemFields, readUpload } from '../uploads.js';
import { HttpError } from '../errors.js';
import type { AppEnv } from '../app.js';

export function registerItemRoutes(app: Hono<AppEnv>, ctx: AppContext) {
  const items = createItemService(ctx);
  app.use('/api/items/*', requireAuth);
  app.use('/api/lists/:id/items', requireAuth);

  app.post('/api/lists/:id/items', async (c) => {
    const payload = await readItemFields(c);
    const input = jsonBody(itemSchema, payload.raw);
    const item = items.create(currentUser(c).id, c.req.param('id'), input, payload.image);
    return c.json(item, 201);
  });

  app.patch('/api/items/:id', async (c) => {
    const input = jsonBody(itemSchema, await c.req.json().catch(() => null));
    return c.json(items.update(currentUser(c).id, c.req.param('id'), input));
  });

  app.delete('/api/items/:id', (c) => {
    items.delete(currentUser(c).id, c.req.param('id'));
    return c.body(null, 204);
  });

  app.patch('/api/items/:id/status', async (c) => {
    const body = jsonBody(statusSchema, await c.req.json().catch(() => null));
    return c.json(items.setStatus(currentUser(c).id, c.req.param('id'), body.isPurchased));
  });

  app.get('/api/items/:id/image', (c) => {
    const image = items.getImage(currentUser(c).id, c.req.param('id'));
    return c.body(new Uint8Array(image.bytes), 200, {
      'content-type': image.mime,
      'cache-control': 'private, max-age=3600',
    });
  });

  app.post('/api/items/:id/image', async (c) => {
    const body = await c.req.parseBody();
    const image = await readUpload(body.image);
    if (!image) throw new HttpError(400, 'Brak pliku zdjęcia');
    return c.json(items.setImage(currentUser(c).id, c.req.param('id'), image));
  });

  app.delete('/api/items/:id/image', (c) => {
    items.clearImage(currentUser(c).id, c.req.param('id'));
    return c.body(null, 204);
  });
}
