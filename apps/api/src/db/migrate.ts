import { readFileSync } from 'node:fs';
import type { Database } from 'better-sqlite3';

export function migrate(db: Database) {
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);
}
