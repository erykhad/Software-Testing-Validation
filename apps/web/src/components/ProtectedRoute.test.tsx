import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/auth/AuthProvider';
import { GuestRoute, ProtectedRoute } from '@/components/ProtectedRoute';
import type { User } from '@/lib/types';

const user: User = { id: '1', email: 'jan@example.com', displayName: 'Jan' };

function renderRoute(value: Pick<AuthContextValue, 'user' | 'loading'>) {
  const auth: AuthContextValue = {
    user: value.user,
    loading: value.loading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };
  return render(
    <MemoryRouter initialEntries={['/lists']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/login" element={<div>Ekran logowania</div>} />
          <Route
            path="/lists"
            element={
              <ProtectedRoute>
                <div>Treść list</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('przekierowuje niezalogowaną osobę', () => {
    renderRoute({ user: null, loading: false });
    expect(screen.getByText('Ekran logowania')).toBeInTheDocument();
  });

  it('pokazuje treść zalogowanej osobie', () => {
    renderRoute({ user, loading: false });
    expect(screen.getByText('Treść list')).toBeInTheDocument();
  });

  it('czeka na sprawdzenie sesji', () => {
    renderRoute({ user: null, loading: true });
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  function renderGuest(value: Pick<AuthContextValue, 'user' | 'loading'>) {
    const auth: AuthContextValue = {
      user: value.user,
      loading: value.loading,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/lists" element={<div>Treść list</div>} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Ekran logowania</div>
                </GuestRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
  }

  it('zostawia gościa na logowaniu', () => {
    renderGuest({ user: null, loading: false });
    expect(screen.getByText('Ekran logowania')).toBeInTheDocument();
  });

  it('omija logowanie, gdy sesja już jest', () => {
    renderGuest({ user, loading: false });
    expect(screen.getByText('Treść list')).toBeInTheDocument();
  });
});
