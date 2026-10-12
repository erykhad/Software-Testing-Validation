import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, jsonRequest, registerUser } from './helpers.js';

describe('współdzielenie listy', () => {
  let db: ReturnType<typeof createTestApp>['db'] | undefined;

  afterEach(() => {
    db?.close();
  });

  it('pozwala współdzielącemu zmienić status i blokuje edycję pozycji', async () => {
    const test = createTestApp();
    db = test.db;
    const owner = await registerUser(test.app, {
      email: 'jan@example.com',
      password: 'haslo1234',
      displayName: 'Jan',
    });
    const guest = await registerUser(test.app, {
      email: 'ania@example.com',
      password: 'haslo1234',
      displayName: 'Ania',
    });

    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'Wspólne', plannedDate: '2026-10-20' }),
    });
    const list = (await created.json()) as { id: string };
    const itemResponse = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'woda', quantity: 6, unit: 'szt' }),
    });
    const item = (await itemResponse.json()) as { id: string };

    const share = await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'ania@example.com' }),
    });
    expect(share.status).toBe(201);

    const guestList = await test.app.request(`/api/lists/${list.id}`, { headers: { cookie: guest.cookie } });
    expect(guestList.status).toBe(200);
    expect(((await guestList.json()) as { role: string }).role).toBe('shared');

    const added = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      ...jsonRequest(guest.cookie, { name: 'ser', quantity: 1, unit: 'opak' }),
    });
    expect(added.status).toBe(403);

    const edited = await test.app.request(`/api/items/${item.id}`, {
      method: 'PATCH',
      ...jsonRequest(guest.cookie, { name: 'woda', quantity: 1, unit: 'szt' }),
    });
    expect(edited.status).toBe(403);

    const removed = await test.app.request(`/api/items/${item.id}`, {
      method: 'DELETE',
      headers: { cookie: guest.cookie },
    });
    expect(removed.status).toBe(403);

    const status = await test.app.request(`/api/items/${item.id}/status`, {
      method: 'PATCH',
      ...jsonRequest(guest.cookie, { isPurchased: true }),
    });
    expect(status.status).toBe(200);

    const ownerView = (await (
      await test.app.request(`/api/lists/${list.id}`, { headers: { cookie: owner.cookie } })
    ).json()) as { items: { isPurchased: boolean }[]; purchasedCount: number };
    expect(ownerView.items[0]?.isPurchased).toBe(true);
    expect(ownerView.purchasedCount).toBe(1);
  });

  it('ukrywa cudzą listę i nie pozwala udostępnić jej sobie', async () => {
    const test = createTestApp();
    db = test.db;
    const owner = await registerUser(test.app);
    const stranger = await registerUser(test.app, {
      email: 'obcy@example.com',
      password: 'haslo1234',
      displayName: 'Obcy',
    });
    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'Prywatna' }),
    });
    const list = (await created.json()) as { id: string };
    const hidden = await test.app.request(`/api/lists/${list.id}`, { headers: { cookie: stranger.cookie } });
    expect(hidden.status).toBe(404);

    const selfShare = await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'jan@example.com' }),
    });
    expect(selfShare.status).toBe(400);
  });
});
