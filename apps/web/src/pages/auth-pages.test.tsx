import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(),
    ...overrides,
  };
}

function renderAt(element: ReactNode, value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route path="/start" element={element} />
          <Route path="/lists" element={<p>listy</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('logowanie i rejestracja', () => {
  it('loguje i przechodzi do list', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => undefined);
    renderAt(<LoginPage />, auth({ login }));
    await user.type(screen.getByTestId('login-email'), 'jan@example.com');
    await user.type(screen.getByTestId('login-password'), 'haslo1234');
    await user.click(screen.getByTestId('login-submit'));
    expect(login).toHaveBeenCalledWith({ email: 'jan@example.com', password: 'haslo1234' });
    expect(await screen.findByText('listy')).toBeInTheDocument();
  });

  it('pokazuje błąd logowania', async () => {
    const user = userEvent.setup();
    renderAt(<LoginPage />, auth({ login: async () => { throw new ApiError(401, 'Złe hasło'); } }));
    await user.type(screen.getByTestId('login-email'), 'jan@example.com');
    await user.type(screen.getByTestId('login-password'), 'zle');
    await user.click(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('login-error')).toHaveTextContent('Złe hasło');
  });

  it('nie wysyła pustego logowania', async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    renderAt(<LoginPage />, auth({ login }));
    await user.click(screen.getByTestId('login-submit'));
    expect(login).not.toHaveBeenCalled();
  });

  it('zakłada konto i przechodzi do list', async () => {
    const user = userEvent.setup();
    const register = vi.fn(async () => undefined);
    renderAt(<RegisterPage />, auth({ register }));
    await user.type(screen.getByTestId('register-name'), 'Jan');
    await user.type(screen.getByTestId('register-email'), 'jan@example.com');
    await user.type(screen.getByTestId('register-password'), 'haslo1234');
    await user.click(screen.getByTestId('register-submit'));
    expect(register).toHaveBeenCalled();
    expect(await screen.findByText('listy')).toBeInTheDocument();
  });

  it('pokazuje błąd rejestracji spoza ApiError', async () => {
    const user = userEvent.setup();
    renderAt(<RegisterPage />, auth({ register: async () => { throw new Error('sieć'); } }));
    await user.type(screen.getByTestId('register-name'), 'Jan');
    await user.type(screen.getByTestId('register-email'), 'jan@example.com');
    await user.type(screen.getByTestId('register-password'), 'haslo1234');
    await user.click(screen.getByTestId('register-submit'));
    expect(await screen.findByTestId('register-error')).toHaveTextContent('Nie udało się utworzyć konta');
  });
});
