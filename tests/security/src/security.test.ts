import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../../apps/api/src/app.ts';
import { openDatabase } from '../../../apps/api/src/db/connection.ts';
import { migrate } from '../../../apps/api/src/db/migrate.ts';
import { createTestApp, registerUser, TINY_PNG } from '../../../apps/api/src/integration/helpers.ts';

describe('bezpieczeństwo API', () => {
  const databases: Array<{ close: () => void }> = [];

  afterEach(() => {
    for (const db of databases.splice(0)) db.close();
  });

  function testApp(options: Parameters<typeof createApp>[1] = {}) {
    const created = createTestApp(options);
    databases.push(created.db);
    return created;
  }

  it('ustawia nagłówki ochronne i flagi ciasteczka sesji', async () => {
    const { app } = testApp({ secureCookies: true });
    const health = await app.request('/api/health');
    expect(health.headers.get('x-content-type-options')).toBe('nosniff');
    expect(health.headers.get('x-frame-options')?.toLowerCase()).toBe('sameorigin');

    const registered = await registerUser(app);
    const setCookie = registered.response.headers.getSetCookie().join(';');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure');
  });

  it('blokuje żądania bez sesji', async () => {
    const { app } = testApp();
    expect((await app.request('/api/lists')).status).toBe(401);
    expect((await app.request('/api/auth/me')).status).toBe(401);
    expect((await app.request('/api/popular-products')).status).toBe(401);
  });

  it('ogranicza liczbę prób logowania', async () => {
    const db = openDatabase(':memory:');
    migrate(db);
    databases.push(db);
    const app = createApp(db, { rateLimitMax: 3, rateLimitWindowMs: 60_000 });
    const attempt = () =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jan@example.com', password: 'zle-haslo-1' }),
      });

    for (let index = 0; index < 3; index += 1) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });

  it('traktuje wstrzyknięcie SQL jako zwykły tekst', async () => {
    const { app } = testApp();
    const owner = await registerUser(app);
    const payload = `'; DROP TABLE lists; --`;
    const created = await app.request('/api/lists', {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: payload }),
    });
    expect(created.status).toBe(201);
    const lists = await app.request('/api/lists', { headers: { cookie: owner.cookie } });
    const body = (await lists.json()) as { lists: { name: string }[] };
    expect(body.lists.map((list) => list.name)).toContain(payload);

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: "jan@example.com' OR '1'='1", password: 'haslo1234' }),
    });
    expect(login.status).toBe(400);
    const stillThere = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'jan@example.com', password: 'haslo1234' }),
    });
    expect(stillThere.status).toBe(200);
  });

  it('zwraca nazwę z payloadem XSS jako JSON, a nie dokument HTML', async () => {
    const { app } = testApp();
    const owner = await registerUser(app);
    const created = await app.request('/api/lists', {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Lista' }),
    });
    const list = (await created.json()) as { id: string };
    const payload = `<img src=x onerror=alert(1)>`;
    const itemResponse = await app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: payload, quantity: 1, unit: 'szt' }),
    });
    expect(itemResponse.headers.get('content-type')).toContain('application/json');
    const item = (await itemResponse.json()) as { name: string };
    expect(item.name).toBe(payload);
    expect(JSON.stringify(item).startsWith('<')).toBe(false);
  });

  it('nie pozwala odczytać ani zmienić cudzej listy i zdjęcia', async () => {
    const { app } = testApp();
    const owner = await registerUser(app);
    const stranger = await registerUser(app, {
      email: 'obcy@example.com',
      password: 'haslo1234',
      displayName: 'Obcy',
    });
    const created = await app.request('/api/lists', {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Prywatna' }),
    });
    const list = (await created.json()) as { id: string };
    const form = new FormData();
    form.set('name', 'ser');
    form.set('quantity', '1');
    form.set('unit', 'opak');
    form.set('image', new File([new Uint8Array(TINY_PNG)], 'ser.png', { type: 'image/png' }));
    const itemResponse = await app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie: owner.cookie },
      body: form,
    });
    const item = (await itemResponse.json()) as { id: string };

    expect((await app.request(`/api/lists/${list.id}`, { headers: { cookie: stranger.cookie } })).status).toBe(404);
    expect((await app.request(`/api/items/${item.id}/image`, { headers: { cookie: stranger.cookie } })).status).toBe(404);
    const status = await app.request(`/api/items/${item.id}/status`, {
      method: 'PATCH',
      headers: { cookie: stranger.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ isPurchased: true }),
    });
    expect(status.status).toBe(404);
    expect((await app.request(`/api/items/${item.id}/image`, { headers: { cookie: owner.cookie } })).status).toBe(200);
    expect(item.id).toBeTruthy();
  });

  it('odrzuca niedozwolony typ, podrobiony PNG i zbyt duże zdjęcie', async () => {
    const { app } = testApp();
    const owner = await registerUser(app);
    const created = await app.request('/api/lists', {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Zdjęcia' }),
    });
    const list = (await created.json()) as { id: string };

    const text = new FormData();
    text.set('name', 'notatka');
    text.set('quantity', '1');
    text.set('unit', 'szt');
    text.set('image', new File(['<html></html>'], 'x.html', { type: 'text/html' }));
    expect((await app.request(`/api/lists/${list.id}/items`, { method: 'POST', headers: { cookie: owner.cookie }, body: text })).status).toBe(400);

    const fake = new FormData();
    fake.set('name', 'podrobione');
    fake.set('quantity', '1');
    fake.set('unit', 'szt');
    fake.set('image', new File(['to nie jest png'], 'x.png', { type: 'image/png' }));
    expect((await app.request(`/api/lists/${list.id}/items`, { method: 'POST', headers: { cookie: owner.cookie }, body: fake })).status).toBe(400);

    const oversized = new FormData();
    oversized.set('name', 'duze');
    oversized.set('quantity', '1');
    oversized.set('unit', 'szt');
    oversized.set('image', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
    const rejected = await app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie: owner.cookie },
      body: oversized,
    });
    expect(rejected.status).toBe(400);
    expect(((await rejected.json()) as { error: string }).error).toContain('2 MB');
  });
});
