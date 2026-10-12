import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, registerUser } from './helpers.js';

describe('uwierzytelnianie', () => {
  let db: ReturnType<typeof createTestApp>['db'] | undefined;

  afterEach(() => {
    db?.close();
  });

  it('rejestruje, zwraca sesję i wylogowuje', async () => {
    const test = createTestApp();
    db = test.db;
    const { response, body, cookie } = await registerUser(test.app);
    expect(response.status).toBe(201);
    expect(body.user.email).toBe('jan@example.com');
    expect(cookie.startsWith('session=')).toBe(true);

    const me = await test.app.request('/api/auth/me', { headers: { cookie } });
    expect(me.status).toBe(200);

    const logout = await test.app.request('/api/auth/logout', { method: 'POST', headers: { cookie } });
    expect(logout.status).toBe(204);
    const again = await test.app.request('/api/auth/me', { headers: { cookie } });
    expect(again.status).toBe(401);
  });

  it('nie rozróżnia nieznanego konta i złego hasła', async () => {
    const test = createTestApp();
    db = test.db;
    await registerUser(test.app);
    const unknown = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'brak@example.com', password: 'haslo1234' }),
    });
    const wrong = await test.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'jan@example.com', password: 'zle-haslo' }),
    });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrong.json());
  });

  it('odrzuca drugą rejestrację tego samego adresu', async () => {
    const test = createTestApp();
    db = test.db;
    await registerUser(test.app);
    const duplicate = await test.app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'Jan@example.com', password: 'haslo1234', displayName: 'Inny' }),
    });
    expect(duplicate.status).toBe(409);
  });

  it('wymaga sesji do odczytu list', async () => {
    const test = createTestApp();
    db = test.db;
    const response = await test.app.request('/api/lists');
    expect(response.status).toBe(401);
  });
});
