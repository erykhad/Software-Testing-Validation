import type { Hono } from 'hono';
import type { AppContext } from '../context.js';
import { createListSchema, shareSchema, updateListSchema } from '../domain/schemas.js';
import { currentUser, jsonBody } from '../http.js';
import { requireAuth } from '../middleware/auth.js';
import { createListService } from '../services/lists.js';
import { createSharingService } from '../services/sharing.js';
import type { AppEnv } from '../app.js';

export function registerListRoutes(app: Hono<AppEnv>, ctx: AppContext) {
  const lists = createListService(ctx);
  const sharing = createSharingService(ctx);
  app.use('/api/lists', requireAuth);
  app.use('/api/lists/*', requireAuth);

  app.get('/api/lists', (c) => {
    return c.json({ lists: lists.list(currentUser(c).id) });
  });

  app.post('/api/lists', async (c) => {
    const body = jsonBody(createListSchema, await c.req.json().catch(() => null));
    const list = lists.create(currentUser(c).id, body);
    return c.json(list, 201);
  });

  app.get('/api/lists/:id', (c) => {
    return c.json(lists.get(currentUser(c).id, c.req.param('id')));
  });

  app.patch('/api/lists/:id', async (c) => {
    const body = jsonBody(updateListSchema, await c.req.json().catch(() => null));
    return c.json(lists.update(currentUser(c).id, c.req.param('id'), body));
  });

  app.delete('/api/lists/:id', (c) => {
    lists.delete(currentUser(c).id, c.req.param('id'));
    return c.body(null, 204);
  });

  app.post('/api/lists/:id/shares', async (c) => {
    const body = jsonBody(shareSchema, await c.req.json().catch(() => null));
    const share = sharing.share(currentUser(c).id, c.req.param('id'), body.email);
    return c.json(share, 201);
  });

  app.delete('/api/lists/:id/shares/:userId', (c) => {
    sharing.unshare(currentUser(c).id, c.req.param('id'), c.req.param('userId'));
    return c.body(null, 204);
  });
}
