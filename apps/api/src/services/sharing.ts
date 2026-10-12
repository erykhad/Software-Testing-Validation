import type { AppContext } from '../context.js';
import { HttpError } from '../errors.js';
import { requireEdit } from './access.js';

export function createSharingService(ctx: AppContext) {
  return {
    share(ownerId: string, listId: string, email: string) {
      requireEdit(ctx, listId, ownerId);
      const user = ctx.users.findByEmail(email.toLowerCase());
      if (!user) {
        throw new HttpError(404, 'Nie znaleziono użytkownika o podanym adresie e-mail');
      }
      if (user.id === ownerId) {
        throw new HttpError(400, 'Nie możesz udostępnić listy samemu sobie');
      }
      if (ctx.shares.exists(listId, user.id)) {
        throw new HttpError(409, 'Lista jest już udostępniona temu użytkownikowi');
      }
      const now = new Date().toISOString();
      ctx.shares.insert(listId, user.id, now);
      ctx.lists.touch(listId, now);
      return { userId: user.id, email: user.email, displayName: user.displayName };
    },
    unshare(ownerId: string, listId: string, userId: string) {
      requireEdit(ctx, listId, ownerId);
      const removed = ctx.shares.delete(listId, userId);
      if (!removed) throw new HttpError(404, 'Nie znaleziono udostępnienia');
      ctx.lists.touch(listId, new Date().toISOString());
    },
  };
}
