import { canEditItems, canToggleStatus, canViewList } from '../domain/permissions.js';
import { HttpError } from '../errors.js';
import type { AppContext } from '../context.js';

export function requireView(ctx: AppContext, listId: string, userId: string) {
  const access = ctx.lists.access(listId);
  if (!access || !canViewList(userId, access)) {
    throw new HttpError(404, 'Nie znaleziono listy');
  }
  return access;
}

export function requireEdit(ctx: AppContext, listId: string, userId: string) {
  const access = requireView(ctx, listId, userId);
  if (!canEditItems(userId, access)) {
    throw new HttpError(403, 'Brak uprawnień do edycji tej listy');
  }
  return access;
}

export function requireToggle(ctx: AppContext, listId: string, userId: string) {
  const access = requireView(ctx, listId, userId);
  if (!canToggleStatus(userId, access)) {
    throw new HttpError(403, 'Brak uprawnień do zmiany statusu');
  }
  return access;
}
