import type { Database } from 'better-sqlite3';

export type ShareRecord = {
  userId: string;
  email: string;
  displayName: string;
};

export function createShareRepo(db: Database) {
  const insert = db.prepare('INSERT INTO list_shares (list_id, user_id, created_at) VALUES (?, ?, ?)');
  const remove = db.prepare('DELETE FROM list_shares WHERE list_id = ? AND user_id = ?');
  const listForList = db.prepare(
    `SELECT u.id AS user_id, u.email, u.display_name
     FROM list_shares s
     JOIN users u ON u.id = s.user_id
     WHERE s.list_id = ?
     ORDER BY u.email ASC`,
  );
  const exists = db.prepare('SELECT 1 AS ok FROM list_shares WHERE list_id = ? AND user_id = ?');

  return {
    insert(listId: string, userId: string, createdAt: string) {
      insert.run(listId, userId, createdAt);
    },
    delete(listId: string, userId: string) {
      return remove.run(listId, userId).changes > 0;
    },
    list(listId: string): ShareRecord[] {
      const rows = listForList.all(listId) as {
        user_id: string;
        email: string;
        display_name: string;
      }[];
      return rows.map((row) => ({
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
      }));
    },
    exists(listId: string, userId: string) {
      return Boolean(exists.get(listId, userId));
    },
  };
}
