import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

describe('App', () => {
  it('nieznaną ścieżkę sprowadza do logowania, gdy nie ma sesji', async () => {
    window.history.pushState({}, '', '/nie-ma');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Wymagane logowanie' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })),
    );
    render(<App />);
    expect(await screen.findByTestId('login-email')).toBeInTheDocument();
  });
});
