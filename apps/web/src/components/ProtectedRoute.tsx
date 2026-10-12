import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p data-testid="auth-loading">Wczytywanie…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p data-testid="auth-loading">Wczytywanie…</p>;
  if (user) return <Navigate to="/lists" replace />;
  return children;
}
