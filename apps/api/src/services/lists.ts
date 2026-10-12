import { randomUUID } from 'node:crypto';
import type { AppContext } from '../context.js';
import type { CreateListInput, UpdateListInput } from '../domain/schemas.js';
import { HttpError } from '../errors.js';
import { requireEdit } from './access.js';

function withDetails(ctx: AppContext, userId: string, listId: string) {
  const list = ctx.lists.findForUser(listId, userId);
  if (!list) throw new HttpError(404, 'Nie znaleziono listy');
  return {
    ...list,
    items: ctx.items.listByList(list.id),
    shares: list.role === 'owner' ? ctx.shares.list(list.id) : [],
  };
}

export function createListService(ctx: AppContext) {
  return {
    list(userId: string) {
      return ctx.lists.listForUser(userId);
    },
    get(userId: string, listId: string) {
      return withDetails(ctx, userId, listId);
    },
    create(userId: string, input: CreateListInput) {
      const now = new Date().toISOString();
      const id = randomUUID();
      ctx.lists.insert({
        id,
        ownerId: userId,
        name: input.name,
        plannedDate: input.plannedDate ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return withDetails(ctx, userId, id);
    },
    update(userId: string, listId: string, patch: UpdateListInput) {
      requireEdit(ctx, listId, userId);
      const current = ctx.lists.findForUser(listId, userId);
      if (!current) throw new HttpError(404, 'Nie znaleziono listy');
      const updatedAt = new Date().toISOString();
      const updated = ctx.lists.update({
        id: listId,
        ownerId: userId,
        name: patch.name ?? current.name,
        plannedDate: patch.plannedDate === undefined ? current.plannedDate : patch.plannedDate,
        updatedAt,
      });
      if (!updated) throw new HttpError(403, 'Brak uprawnień do edycji tej listy');
      return withDetails(ctx, userId, listId);
    },
    delete(userId: string, listId: string) {
      requireEdit(ctx, listId, userId);
      const removed = ctx.lists.delete(listId, userId);
      if (!removed) throw new HttpError(404, 'Nie znaleziono listy');
    },
  };
}
