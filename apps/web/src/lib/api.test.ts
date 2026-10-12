import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '@/lib/api';

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('ustawia JSON i zwraca ciało', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
      return json(200, { ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api('/api/lists', { method: 'POST', body: '{}' })).resolves.toEqual({ ok: true });
  });

  it('nie nadpisuje typu dla formularza i akceptuje pustą odpowiedź', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      expect(new Headers(init?.headers).has('content-type')).toBe(false);
      return json(204);
    }));
    await expect(api('/api/lists/1', { method: 'DELETE', body: new FormData() })).resolves.toBeUndefined();
  });

  it('rzuca komunikat z odpowiedzi albo ogólny, gdy ciało nie jest JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(400, { error: 'Zła nazwa' })));
    await expect(api('/api/lists')).rejects.toMatchObject({ status: 400, message: 'Zła nazwa' });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('nie-json', { status: 500 })));
    await expect(api('/api/lists')).rejects.toBeInstanceOf(ApiError);
    await expect(api('/api/lists')).rejects.toThrow('Coś poszło nie tak');
  });
});
