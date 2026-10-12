import type { Database } from 'better-sqlite3';

export type ListRole = 'owner' | 'shared';

export type ListRecord = {
  id: string;
  ownerId: string;
  name: string;
  plannedDate: string | null;
  createdAt: string;
  updatedAt: string;
  role: ListRole;
  itemCount: number;
  purchasedCount: number;
};

type ListRow = {
  id: string;
  owner_id: string;
  name: string;
  planned_date: string | null;
  created_at: string;
  updated_at: string;
  role: ListRole;
  item_count: number;
  purchased_count: number;
};

function mapList(row: ListRow): ListRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    plannedDate: row.planned_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: row.role,
    itemCount: row.item_count,
    purchasedCount: row.purchased_count,
  };
}

const LIST_SELECT = `
  SELECT l.id, l.owner_id, l.name, l.planned_date, l.created_at, l.updated_at,
    CASE WHEN l.owner_id = ? THEN 'owner' ELSE 'shared' END AS role,
    (SELECT COUNT(*) FROM items i WHERE i.list_id = l.id) AS item_count,
    (SELECT COALESCE(SUM(i.is_purchased), 0) FROM items i WHERE i.list_id = l.id) AS purchased_count
  FROM lists l
`;

export function createListRepo(db: Database) {
  const insert = db.prepare(
    `INSERT INTO lists (id, owner_id, name, planned_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const listForUser = db.prepare(
    `${LIST_SELECT}
     WHERE l.owner_id = ? OR l.id IN (SELECT list_id FROM list_shares WHERE user_id = ?)
     ORDER BY l.updated_at DESC`,
  );
  const oneForUser = db.prepare(
    `${LIST_SELECT}
     WHERE l.id = ? AND (l.owner_id = ? OR l.id IN (SELECT list_id FROM list_shares WHERE user_id = ?))`,
  );
  const update = db.prepare(
    `UPDATE lists SET name = ?, planned_date = ?, updated_at = ? WHERE id = ? AND owner_id = ?`,
  );
  const remove = db.prepare('DELETE FROM lists WHERE id = ? AND owner_id = ?');
  const touch = db.prepare('UPDATE lists SET updated_at = ? WHERE id = ?');
  const owner = db.prepare('SELECT owner_id FROM lists WHERE id = ?');
  const sharedIds = db.prepare('SELECT user_id FROM list_shares WHERE list_id = ?');

  return {
    insert(list: {
      id: string;
      ownerId: string;
      name: string;
      plannedDate: string | null;
      createdAt: string;
      updatedAt: string;
    }) {
      insert.run(list.id, list.ownerId, list.name, list.plannedDate, list.createdAt, list.updatedAt);
    },
    listForUser(userId: string) {
      const rows = listForUser.all(userId, userId, userId) as ListRow[];
      return rows.map(mapList);
    },
    findForUser(listId: string, userId: string) {
      const row = oneForUser.get(userId, listId, userId, userId) as ListRow | undefined;
      return row ? mapList(row) : null;
    },
    update(input: {
      id: string;
      ownerId: string;
      name: string;
      plannedDate: string | null;
      updatedAt: string;
    }) {
      return update.run(input.name, input.plannedDate, input.updatedAt, input.id, input.ownerId).changes > 0;
    },
    delete(listId: string, ownerId: string) {
      return remove.run(listId, ownerId).changes > 0;
    },
    touch(listId: string, updatedAt: string) {
      touch.run(updatedAt, listId);
    },
    access(listId: string) {
      const row = owner.get(listId) as { owner_id: string } | undefined;
      if (!row) return null;
      const shares = sharedIds.all(listId) as { user_id: string }[];
      return {
        ownerId: row.owner_id,
        sharedUserIds: shares.map((share) => share.user_id),
      };
    },
  };
}
