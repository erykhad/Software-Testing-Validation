import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { openDatabase } from './db/connection.js';
import { migrate } from './db/migrate.js';

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
const port = Number(process.env.PORT ?? 3000);
const db = openDatabase(dbPath);
migrate(db);

const rateLimitMax = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10);

const app = createApp(db, {
  secureCookies: process.env.NODE_ENV === 'production',
  rateLimitMax: Number.isFinite(rateLimitMax) && rateLimitMax > 0 ? rateLimitMax : 10,
});

serve({ fetch: app.fetch, hostname: '127.0.0.1', port }, () => {
  console.log(`API nasłuchuje na http://127.0.0.1:${port}`);
});
