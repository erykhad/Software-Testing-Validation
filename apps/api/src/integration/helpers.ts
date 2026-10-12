import type { Hono } from 'hono';
import { createApp, type AppEnv, type AppOptions } from '../app.js';
import { openDatabase } from '../db/connection.js';
import { migrate } from '../db/migrate.js';

export function createTestApp(options: AppOptions = {}) {
  const db = openDatabase(':memory:');
  migrate(db);
  const app = createApp(db, { rateLimitMax: 1000, secureCookies: false, ...options });
  return { app, db };
}

export function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((entry) => entry.startsWith('session='));
  return session?.split(';')[0] ?? '';
}

export async function registerUser(
  app: Hono<AppEnv>,
  user: { email: string; password: string; displayName: string } = {
    email: 'jan@example.com',
    password: 'haslo1234',
    displayName: 'Jan',
  },
) {
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(user),
  });
  const body = (await response.json()) as { user: { id: string; email: string; displayName: string } };
  return { response, body, cookie: cookieHeader(response) };
}

export function jsonRequest(cookie: string, body?: unknown, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { cookie, ...extra };
  if (body !== undefined) headers['content-type'] = 'application/json';
  return {
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
