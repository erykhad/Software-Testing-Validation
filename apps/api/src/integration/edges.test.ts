import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContext } from '../context.js';
import { openDatabase } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';
import { requireToggle } from '../services/access.js';
import { createTestApp, jsonRequest, registerUser, TINY_PNG } from './helpers.js';

describe('brzegi API', () => {
  let db: ReturnType<typeof createTestApp>['db'] | undefined;

  afterEach(() => {
    try {
      db?.close();
    } catch {
      db = undefined;
    }
  });

  it('odpowiada na health i ukrywa nieznaną ścieżkę', async () => {
    const test = createTestApp();
    db = test.db;
    expect(await (await test.app.request('/api/health')).json()).toEqual({ ok: true });
    expect((await test.app.request('/api/brak')).status).toBe(404);
  });

  it('loguje istniejące konto i stawia bezpieczne ciasteczko', async () => {
    const test = createTestApp({ secureCookies: true });
    db = test.db;
    await registerUser(test.app);
    const login = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'jan@example.com', password: 'haslo1234' }),
    });
    expect(login.status).toBe(200);
    expect(login.headers.get('set-cookie')).toContain('Secure');
    const logout = await test.app.request('/api/auth/logout', { method: 'POST' });
    expect(logout.status).toBe(204);
  });

  it('odrzuca puste ciało, złe dane i limit prób z nagłówka proxy', async () => {
    const test = createTestApp({ rateLimitMax: 1 });
    db = test.db;
    const empty = await test.app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'null',
    });
    expect(empty.status).toBe(400);

    const { cookie } = await registerUser(test.app);
    const broken = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(cookie, undefined),
      body: '{',
      headers: { cookie, 'content-type': 'application/json' },
    });
    expect(broken.status).toBe(400);

    const first = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.8, 10.0.0.1' },
      body: JSON.stringify({ email: 'brak@example.com', password: 'haslo1234' }),
    });
    const second = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.8' },
      body: JSON.stringify({ email: 'brak@example.com', password: 'haslo1234' }),
    });
    expect(first.status).toBe(401);
    expect(second.status).toBe(429);
  });

  it('odrzuca zbyt duże żądanie i zwraca 500, gdy baza jest zamknięta', async () => {
    const test = createTestApp();
    db = test.db;
    const huge = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'x'.repeat(3 * 1024 * 1024 + 1),
    });
    expect(huge.status).toBe(413);

    const { cookie } = await registerUser(test.app);
    test.db.close();
    db = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failed = await test.app.request('/api/lists', { headers: { cookie } });
    expect(failed.status).toBe(500);
    spy.mockRestore();
  });

  it('listuje, aktualizuje datę i obsługuje udostępnianie', async () => {
    const test = createTestApp();
    db = test.db;
    const owner = await registerUser(test.app);
    const guest = await registerUser(test.app, {
      email: 'ania@example.com',
      password: 'haslo1234',
      displayName: 'Ania',
    });
    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'Tydzień', plannedDate: '2026-10-16' }),
    });
    const list = (await created.json()) as { id: string };
    const listed = await test.app.request('/api/lists', { headers: { cookie: owner.cookie } });
    expect(((await listed.json()) as { lists: unknown[] }).lists).toHaveLength(1);

    const dated = await test.app.request(`/api/lists/${list.id}`, {
      method: 'PATCH',
      ...jsonRequest(owner.cookie, { plannedDate: null }),
    });
    expect(((await dated.json()) as { plannedDate: string | null }).plannedDate).toBeNull();

    const missingUser = await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'nikt@example.com' }),
    });
    expect(missingUser.status).toBe(404);

    const share = await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'ania@example.com' }),
    });
    const shared = (await share.json()) as { userId: string };
    const again = await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'ania@example.com' }),
    });
    expect(again.status).toBe(409);

    const guestUnshare = await test.app.request(`/api/lists/${list.id}/shares/${shared.userId}`, {
      method: 'DELETE',
      headers: { cookie: guest.cookie },
    });
    expect(guestUnshare.status).toBe(403);

    const unshare = await test.app.request(`/api/lists/${list.id}/shares/${shared.userId}`, {
      method: 'DELETE',
      headers: { cookie: owner.cookie },
    });
    expect(unshare.status).toBe(204);
    const missingShare = await test.app.request(`/api/lists/${list.id}/shares/${shared.userId}`, {
      method: 'DELETE',
      headers: { cookie: owner.cookie },
    });
    expect(missingShare.status).toBe(404);

    expect(createContext(test.db).users.findById(owner.body.user.id)?.email).toBe('jan@example.com');
    expect(createContext(test.db).users.findById('brak')).toBeNull();
    expect(requireToggle(createContext(test.db), list.id, owner.body.user.id).ownerId).toBe(owner.body.user.id);
  });

  it('wymienia zdjęcie pozycji i odrzuca braki oraz zły plik', async () => {
    const test = createTestApp();
    db = test.db;
    const owner = await registerUser(test.app);
    const guest = await registerUser(test.app, {
      email: 'ania@example.com',
      password: 'haslo1234',
      displayName: 'Ania',
    });
    const created = await test.app.request('/api/lists', {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'Spiżarnia' }),
    });
    const list = (await created.json()) as { id: string };
    const added = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'ser', quantity: 1, unit: 'opak' }),
    });
    const item = (await added.json()) as { id: string; hasImage: boolean };
    expect(item.hasImage).toBe(false);

    const missing = await test.app.request(`/api/items/${item.id}/image`, { headers: { cookie: owner.cookie } });
    expect(missing.status).toBe(404);

    const emptyForm = new FormData();
    const noFile = await test.app.request(`/api/items/${item.id}/image`, {
      method: 'POST',
      headers: { cookie: owner.cookie },
      body: emptyForm,
    });
    expect(noFile.status).toBe(400);

    const form = new FormData();
    form.set('image', new File([new Uint8Array(TINY_PNG)], 'ser.png', { type: 'image/png' }));
    const uploaded = await test.app.request(`/api/items/${item.id}/image`, {
      method: 'POST',
      headers: { cookie: owner.cookie },
      body: form,
    });
    expect(((await uploaded.json()) as { hasImage: boolean }).hasImage).toBe(true);

    await test.app.request(`/api/lists/${list.id}/shares`, {
      method: 'POST',
      ...jsonRequest(owner.cookie, { email: 'ania@example.com' }),
    });
    const forbidden = await test.app.request(`/api/items/${item.id}/image`, {
      method: 'DELETE',
      headers: { cookie: guest.cookie },
    });
    expect(forbidden.status).toBe(403);

    const cleared = await test.app.request(`/api/items/${item.id}/image`, {
      method: 'DELETE',
      headers: { cookie: owner.cookie },
    });
    expect(cleared.status).toBe(204);

    const brokenItem = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie: owner.cookie, 'content-type': 'application/json' },
      body: '{',
    });
    expect(brokenItem.status).toBe(400);

    const unknownList = await test.app.request('/api/lists/brak-listy/items', {
      method: 'POST',
      ...jsonRequest(owner.cookie, { name: 'woda', quantity: 1, unit: 'szt' }),
    });
    expect(unknownList.status).toBe(404);

    const big = new FormData();
    big.set('name', 'mąka');
    big.set('quantity', '1');
    big.set('unit', 'kg');
    big.set('image', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'duze.png', { type: 'image/png' }));
    const oversized = await test.app.request(`/api/lists/${list.id}/items`, {
      method: 'POST',
      headers: { cookie: owner.cookie },
      body: big,
    });
    expect(oversized.status).toBe(400);
  });

  it('otwiera plikową bazę i seeduje popularne produkty', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shopping-db-'));
    const file = openDatabase(path.join(dir, 'nested', 'app.sqlite'));
    expect(file.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(seedDatabase(file)).toBeGreaterThan(0);
    expect(seedDatabase(file)).toBeGreaterThan(0);
    file.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
