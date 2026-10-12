import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';

const user = { id: '1', email: 'jan@example.com', displayName: 'Jan' };

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <p>{auth.loading ? 'ładowanie' : auth.user?.displayName ?? 'gość'}</p>
      <button type="button" onClick={() => void auth.login({ email: 'jan@example.com', password: 'haslo1234' })}>
        zaloguj
      </button>
      <button type="button" onClick={() => void auth.register({ email: 'jan@example.com', password: 'haslo1234', displayName: 'Jan' })}>
        zarejestruj
      </button>
      <button type="button" onClick={() => void auth.logout()}>wyloguj</button>
    </div>
  );
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthProvider', () => {
  it('wczytuje sesję, loguje, rejestruje i wylogowuje', async () => {
    const actor = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/api/auth/me')) return json(200, { user });
      if (url.endsWith('/api/auth/login')) return json(200, { user: { ...user, displayName: 'Po logowaniu' } });
      if (url.endsWith('/api/auth/register')) return json(201, { user: { ...user, displayName: 'Po rejestracji' } });
      if (url.endsWith('/api/auth/logout') && method === 'POST') return new Response(null, { status: 204 });
      return json(404, { error: 'brak' });
    }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('Jan')).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'zaloguj' }));
    expect(await screen.findByText('Po logowaniu')).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'zarejestruj' }));
    expect(await screen.findByText('Po rejestracji')).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'wyloguj' }));
    expect(await screen.findByText('gość')).toBeInTheDocument();
  });

  it('czyści użytkownika, gdy sesji nie ma', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'Wymagane logowanie' })));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('gość')).toBeInTheDocument();
  });

  it('wymaga providera', () => {
    expect(() => render(<Probe />)).toThrow('useAuth poza AuthProvider');
  });
});
