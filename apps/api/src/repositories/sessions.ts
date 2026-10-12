import type { Database } from 'better-sqlite3';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

type SessionRow = {
  id: string;
  expires_at: string;
  user_id: string;
  email: string;
  display_name: string;
};

export function createSessionRepo(db: Database) {
  const insert = db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)');
  const byId = db.prepare(
    `SELECT s.id, s.expires_at, u.id AS user_id, u.email, u.display_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
  );
  const remove = db.prepare('DELETE FROM sessions WHERE id = ?');
  const purge = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

  return {
    insert(id: string, userId: string, expiresAt: string) {
      insert.run(id, userId, expiresAt);
    },
    findValid(id: string, nowIso: string) {
      const row = byId.get(id, nowIso) as SessionRow | undefined;
      if (!row) return null;
      return {
        id: row.id,
        expiresAt: row.expires_at,
        user: {
          id: row.user_id,
          email: row.email,
          displayName: row.display_name,
        } satisfies SessionUser,
      };
    },
    delete(id: string) {
      remove.run(id);
    },
    deleteExpired(nowIso: string) {
      purge.run(nowIso);
    },
  };
}
