import type { Database } from 'better-sqlite3';
import { createItemRepo } from './repositories/items.js';
import { createListRepo } from './repositories/lists.js';
import { createProductRepo } from './repositories/products.js';
import { createSessionRepo } from './repositories/sessions.js';
import { createShareRepo } from './repositories/shares.js';
import { createUserRepo } from './repositories/users.js';

export function createContext(db: Database) {
  return {
    users: createUserRepo(db),
    sessions: createSessionRepo(db),
    lists: createListRepo(db),
    items: createItemRepo(db),
    shares: createShareRepo(db),
    products: createProductRepo(db),
  };
}

export type AppContext = ReturnType<typeof createContext>;
