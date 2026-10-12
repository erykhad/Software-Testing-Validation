import { randomUUID } from 'node:crypto';
import type { AppContext } from '../context.js';
import { validateImage } from '../domain/image.js';
import { canEditItems, canToggleStatus, canViewList } from '../domain/permissions.js';
import type { ItemInput } from '../domain/schemas.js';
import { HttpError } from '../errors.js';
import { requireEdit } from './access.js';

export type ImagePayload = {
  mime: string;
  bytes: Buffer;
};

function requireItemAccess(ctx: AppContext, itemId: string, userId: string, mode: 'view' | 'edit' | 'toggle') {
  const item = ctx.items.findById(itemId);
  if (!item) throw new HttpError(404, 'Nie znaleziono pozycji');
  const access = ctx.lists.access(item.listId);
  const visible = access && canViewList(userId, access);
  if (!access || !visible) throw new HttpError(404, 'Nie znaleziono pozycji');
  if (mode === 'edit' && !canEditItems(userId, access)) {
    throw new HttpError(403, 'Brak uprawnień do edycji tej listy');
  }
  if (mode === 'toggle' && !canToggleStatus(userId, access)) {
    throw new HttpError(403, 'Brak uprawnień do zmiany statusu');
  }
  return item;
}

function checkedImage(image: ImagePayload | null) {
  if (!image) return null;
  const result = validateImage(image.mime, image.bytes);
  if (!result.ok) throw new HttpError(400, result.error);
  return image;
}

export function createItemService(ctx: AppContext) {
  return {
    create(userId: string, listId: string, input: ItemInput, image: ImagePayload | null) {
      requireEdit(ctx, listId, userId);
      const stored = checkedImage(image);
      const createdAt = new Date().toISOString();
      const id = randomUUID();
      ctx.items.insert({
        id,
        listId,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        image: stored?.bytes ?? null,
        imageMime: stored?.mime ?? null,
        createdAt,
      });
      ctx.lists.touch(listId, createdAt);
      const item = ctx.items.findById(id);
      if (!item) throw new HttpError(500, 'Nie udało się zapisać pozycji');
      return item;
    },
    update(userId: string, itemId: string, input: ItemInput) {
      const item = requireItemAccess(ctx, itemId, userId, 'edit');
      ctx.items.update(item.id, input.name, input.quantity, input.unit);
      const updatedAt = new Date().toISOString();
      ctx.lists.touch(item.listId, updatedAt);
      return ctx.items.findById(item.id);
    },
    delete(userId: string, itemId: string) {
      const item = requireItemAccess(ctx, itemId, userId, 'edit');
      ctx.items.delete(item.id);
      ctx.lists.touch(item.listId, new Date().toISOString());
    },
    setStatus(userId: string, itemId: string, isPurchased: boolean) {
      const item = requireItemAccess(ctx, itemId, userId, 'toggle');
      ctx.items.setStatus(item.id, isPurchased);
      ctx.lists.touch(item.listId, new Date().toISOString());
      return ctx.items.findById(item.id);
    },
    setImage(userId: string, itemId: string, image: ImagePayload) {
      const item = requireItemAccess(ctx, itemId, userId, 'edit');
      const stored = checkedImage(image);
      if (!stored) throw new HttpError(400, 'Brak pliku zdjęcia');
      ctx.items.setImage(item.id, stored.bytes, stored.mime);
      ctx.lists.touch(item.listId, new Date().toISOString());
      return ctx.items.findById(item.id);
    },
    clearImage(userId: string, itemId: string) {
      const item = requireItemAccess(ctx, itemId, userId, 'edit');
      ctx.items.clearImage(item.id);
      ctx.lists.touch(item.listId, new Date().toISOString());
    },
    getImage(userId: string, itemId: string) {
      requireItemAccess(ctx, itemId, userId, 'view');
      const image = ctx.items.image(itemId);
      if (!image) throw new HttpError(404, 'Pozycja nie ma zdjęcia');
      return image;
    },
  };
}
