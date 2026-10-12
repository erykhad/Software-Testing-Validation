import type { Database } from 'better-sqlite3';

export type ItemRecord = {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  hasImage: boolean;
  position: number;
  createdAt: string;
};

type ItemRow = {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  is_purchased: number;
  has_image: number;
  position: number;
  created_at: string;
};

const ITEM_COLUMNS = `
  id, list_id, name, quantity, unit, is_purchased,
  CASE WHEN image IS NULL THEN 0 ELSE 1 END AS has_image,
  position, created_at
`;

function mapItem(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    isPurchased: row.is_purchased === 1,
    hasImage: row.has_image === 1,
    position: row.position,
    createdAt: row.created_at,
  };
}

export type NewItem = {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  image: Buffer | null;
  imageMime: string | null;
  createdAt: string;
};

export function createItemRepo(db: Database) {
  const listByList = db.prepare(
    `SELECT ${ITEM_COLUMNS} FROM items WHERE list_id = ? ORDER BY position ASC, created_at ASC`,
  );
  const byId = db.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = ?`);
  const imageById = db.prepare('SELECT image, image_mime, list_id FROM items WHERE id = ?');
  const nextPos = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM items WHERE list_id = ?');
  const insert = db.prepare(
    `INSERT INTO items (id, list_id, name, quantity, unit, is_purchased, image, image_mime, position, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
  );
  const update = db.prepare('UPDATE items SET name = ?, quantity = ?, unit = ? WHERE id = ?');
  const updateImage = db.prepare('UPDATE items SET image = ?, image_mime = ? WHERE id = ?');
  const clearImage = db.prepare('UPDATE items SET image = NULL, image_mime = NULL WHERE id = ?');
  const setStatus = db.prepare('UPDATE items SET is_purchased = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM items WHERE id = ?');

  const insertTx = db.transaction((input: NewItem) => {
    const posRow = nextPos.get(input.listId) as { pos: number };
    insert.run(
      input.id,
      input.listId,
      input.name,
      input.quantity,
      input.unit,
      input.image,
      input.imageMime,
      posRow.pos,
      input.createdAt,
    );
  });

  return {
    listByList(listId: string) {
      return (listByList.all(listId) as ItemRow[]).map(mapItem);
    },
    findById(id: string) {
      const row = byId.get(id) as ItemRow | undefined;
      return row ? mapItem(row) : null;
    },
    image(id: string) {
      const row = imageById.get(id) as
        | { image: Buffer | null; image_mime: string | null; list_id: string }
        | undefined;
      if (!row?.image || !row.image_mime) return null;
      return { bytes: row.image, mime: row.image_mime, listId: row.list_id };
    },
    insert(input: NewItem) {
      insertTx(input);
    },
    update(id: string, name: string, quantity: number, unit: string) {
      update.run(name, quantity, unit, id);
    },
    setImage(id: string, bytes: Buffer, mime: string) {
      updateImage.run(bytes, mime, id);
    },
    clearImage(id: string) {
      clearImage.run(id);
    },
    setStatus(id: string, isPurchased: boolean) {
      setStatus.run(isPurchased ? 1 : 0, id);
    },
    delete(id: string) {
      remove.run(id);
    },
  };
}
