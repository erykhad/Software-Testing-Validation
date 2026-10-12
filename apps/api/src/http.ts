import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { ZodType } from 'zod';
import { HttpError } from './errors.js';
import type { AppEnv } from './app.js';

const WEEK_SECONDS = 60 * 60 * 24 * 7;

export function jsonBody<T>(schema: ZodType<T>, data: unknown): T {
  if (data === null || data === undefined) {
    throw new HttpError(400, 'Nieprawidłowe dane');
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane');
  }
  return parsed.data;
}

export function attachSession(c: Context<AppEnv>, token: string, secure: boolean) {
  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    path: '/',
    maxAge: WEEK_SECONDS,
  });
}

export function clearSession(c: Context<AppEnv>, secure: boolean) {
  setCookie(c, 'session', '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    path: '/',
    maxAge: 0,
  });
}

export function sessionToken(c: Context<AppEnv>) {
  return getCookie(c, 'session');
}

export function currentUser(c: Context<AppEnv>) {
  const user = c.get('user');
  if (!user) throw new HttpError(401, 'Wymagane logowanie');
  return user;
}
