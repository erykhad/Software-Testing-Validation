import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/AppHeader';

describe('AppHeader', () => {
  it('wylogowuje i wraca do logowania', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => undefined);
    const auth: AuthContextValue = {
      user: { id: '1', email: 'jan@example.com', displayName: 'Jan' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    };
    render(
      <MemoryRouter initialEntries={['/lists']}>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/lists" element={<AppHeader />} />
            <Route path="/login" element={<p>Ekran logowania</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Jan')).toBeInTheDocument();
    await user.click(screen.getByTestId('logout-button'));
    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText('Ekran logowania')).toBeInTheDocument();
  });
});
