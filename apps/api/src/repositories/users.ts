import type { Database } from 'better-sqlite3';

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  created_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function createUserRepo(db: Database) {
  const insert = db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, created_at)
     VALUES (@id, @email, @displayName, @passwordHash, @createdAt)`,
  );
  const byEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const byId = db.prepare('SELECT * FROM users WHERE id = ?');

  return {
    insert(user: UserRecord) {
      insert.run(user);
    },
    findByEmail(email: string) {
      const row = byEmail.get(email) as UserRow | undefined;
      return row ? mapUser(row) : null;
    },
    findById(id: string) {
      const row = byId.get(id) as UserRow | undefined;
      return row ? mapUser(row) : null;
    },
  };
}
