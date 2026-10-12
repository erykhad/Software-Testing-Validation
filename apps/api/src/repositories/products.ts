import type { Database } from 'better-sqlite3';

export type PopularProduct = {
  id: number;
  name: string;
};

export function createProductRepo(db: Database) {
  const all = db.prepare('SELECT id, name FROM popular_products ORDER BY name COLLATE NOCASE ASC');
  return {
    all() {
      return all.all() as PopularProduct[];
    },
  };
}
