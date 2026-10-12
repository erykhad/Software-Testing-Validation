import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, jsonRequest, registerUser, TINY_PNG } from './helpers.js';

describe('listy i pozycje', () => {
  let db: ReturnType<typeof createTestApp>['db'] | undefined;

  afterEach(() => {
    db?.close();
  });

  it('obsługuje pełny CRUD listy i pozycji oraz zdjęcie', async () => {
    const test = createTestApp();
    db = test.db;
    const { cookie } = await registerUser(test.app);

    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(cookie, { name: 'Zakupy na piątek', plannedDate: '2026-10-16' }),
    });
    expect(created.status).toBe(201);
    const list = (await created.json()) as { id: string; name: string; plannedDate: string };

    const renamed = await test.app.request(`/api/lists/${list.id}`, {
      method: 'PATCH',
      ...jsonRequest(cookie, { name: 'Zakupy na sobotę' }),
    });
    expect(renamed.status).toBe(200);
    expect(((await renamed.json()) as { name: string }).name).toBe('Zakupy na sobotę');

    const form = new FormData();
    form.set('name', 'mleko');
    form.set('quantity', '2');
    form.set('unit', 'l');
    form.set('image', new File([new Uint8Array(TINY_PNG)], 'mleko.png', { type: 'image/png' }));
    const itemResponse = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie },
      body: form,
    });
    expect(itemResponse.status).toBe(201);
    const item = (await itemResponse.json()) as { id: string; hasImage: boolean; quantity: number };
    expect(item.hasImage).toBe(true);
    expect(item.quantity).toBe(2);

    const image = await test.app.request(`/api/items/${item.id}/image`, { headers: { cookie } });
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await image.arrayBuffer()).equals(TINY_PNG)).toBe(true);

    const updated = await test.app.request(`/api/items/${item.id}`, {
      method: 'PATCH',
      ...jsonRequest(cookie, { name: 'mleko 2%', quantity: 1, unit: 'l' }),
    });
    expect(updated.status).toBe(200);

    const purchased = await test.app.request(`/api/items/${item.id}/status`, {
      method: 'PATCH',
      ...jsonRequest(cookie, { isPurchased: true }),
    });
    expect(((await purchased.json()) as { isPurchased: boolean }).isPurchased).toBe(true);

    const removedItem = await test.app.request(`/api/items/${item.id}`, {
      method: 'DELETE',
      headers: { cookie },
    });
    expect(removedItem.status).toBe(204);

    const removedList = await test.app.request(`/api/lists/${list.id}`, {
      method: 'DELETE',
      headers: { cookie },
    });
    expect(removedList.status).toBe(204);
    const missing = await test.app.request(`/api/lists/${list.id}`, { headers: { cookie } });
    expect(missing.status).toBe(404);
  });

  it('usuwa pozycje kaskadowo razem z listą', async () => {
    const test = createTestApp();
    db = test.db;
    const { cookie } = await registerUser(test.app);
    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(cookie, { name: 'Na dziś' }),
    });
    const list = (await created.json()) as { id: string };
    await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      ...jsonRequest(cookie, { name: 'chleb', quantity: 1, unit: 'szt' }),
    });
    await test.app.request(`/api/lists/${list.id}`, { method: 'DELETE', headers: { cookie } });
    const count = test.db.prepare('SELECT COUNT(*) AS count FROM items').get() as { count: number };
    expect(count.count).toBe(0);
  });

  it('zwraca popularne produkty tylko po zalogowaniu', async () => {
    const test = createTestApp();
    db = test.db;
    expect((await test.app.request('/api/popular-products')).status).toBe(401);
    const { cookie } = await registerUser(test.app);
    const response = await test.app.request('/api/popular-products', { headers: { cookie } });
    const body = (await response.json()) as { products: { name: string }[] };
    expect(body.products.map((product) => product.name)).toContain('chleb');
    const units = await test.app.request('/api/units', { headers: { cookie } });
    expect(await units.json()).toEqual({ units: ['szt', 'g', 'kg', 'ml', 'l', 'opak'] });
  });
});
