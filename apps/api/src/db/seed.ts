import type { Database } from 'better-sqlite3';
import { openDatabase } from './connection.js';
import { migrate } from './migrate.js';

export function seedDatabase(db: Database) {
  migrate(db);
  const row = db.prepare('SELECT COUNT(*) AS count FROM popular_products').get() as { count: number };
  return row.count;
}

/* v8 ignore start -- punkt wejścia skryptu `pnpm db:seed` */
if (!process.env.VITEST) {
  const db = openDatabase(process.env.DB_PATH ?? './data/app.sqlite');
  const count = seedDatabase(db);
  console.log(`Baza gotowa. Popularnych produktów: ${count}`);
  db.close();
}
/* v8 ignore stop */
