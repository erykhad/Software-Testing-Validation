CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists(owner_id);

CREATE TABLE IF NOT EXISTS list_shares (
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_user ON list_shares(user_id);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0 AND quantity <= 1000000),
  unit TEXT NOT NULL CHECK (unit IN ('szt', 'g', 'kg', 'ml', 'l', 'opak')),
  is_purchased INTEGER NOT NULL DEFAULT 0 CHECK (is_purchased IN (0, 1)),
  image BLOB,
  image_mime TEXT,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_list ON items(list_id);

CREATE TABLE IF NOT EXISTS popular_products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO popular_products (name) VALUES
  ('chleb'),
  ('mleko'),
  ('woda'),
  ('ser'),
  ('masło'),
  ('jajka'),
  ('jabłka'),
  ('banany'),
  ('jogurt'),
  ('ryż'),
  ('makaron'),
  ('pomidory'),
  ('ogórki'),
  ('kurczak'),
  ('kawa'),
  ('herbata'),
  ('cukier'),
  ('mąka'),
  ('olej'),
  ('sól');
