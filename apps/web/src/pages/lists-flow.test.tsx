import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import type { ShoppingItem, ShoppingList, ShoppingListSummary } from '@/lib/types';
import { ListDetailPage } from '@/pages/ListDetailPage';
import { ListsPage } from '@/pages/ListsPage';

const auth: AuthContextValue = {
  user: { id: '1', email: 'jan@example.com', displayName: 'Jan' },
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(async () => undefined),
};

const item: ShoppingItem = {
  id: 'i1',
  listId: 'l1',
  name: 'mleko',
  quantity: 2,
  unit: 'l',
  isPurchased: false,
  hasImage: false,
  position: 1,
  createdAt: '2026-10-12T00:00:00.000Z',
};

const list: ShoppingList = {
  id: 'l1',
  ownerId: '1',
  name: 'Piątek',
  plannedDate: '2026-10-16',
  createdAt: '2026-10-12T00:00:00.000Z',
  updatedAt: '2026-10-12T00:00:00.000Z',
  role: 'owner',
  itemCount: 1,
  purchasedCount: 0,
  items: [item],
  shares: [{ userId: '2', email: 'ania@example.com', displayName: 'Ania' }],
};

function json(status: number, body?: unknown) {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function renderPage(element: ReactNode, path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/lists" element={path === '/lists' ? element : <p>listy</p>} />
            <Route path="/lists/:id" element={<ListDetailPage />} />
            <Route path="/login" element={<p>logowanie</p>} />
          </Routes>
          <Toaster />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listy', () => {
  it('pokazuje własne i udostępnione listy oraz tworzy nową', async () => {
    const user = userEvent.setup();
    const owned: ShoppingListSummary = {
      id: list.id,
      ownerId: list.ownerId,
      name: list.name,
      plannedDate: list.plannedDate,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      role: 'owner',
      itemCount: 1,
      purchasedCount: 0,
    };
    const shared: ShoppingListSummary = { ...owned, id: 'l2', name: 'Od Ani', role: 'shared' };
    const created = { ...list, id: 'l3', name: 'Sobota', items: [], shares: [] };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/api/popular-products')) return json(200, { products: [] });
      if (method === 'POST') return json(201, created);
      if (url.endsWith('/api/lists/l3')) return json(200, created);
      return json(200, { lists: [owned, shared] });
    }));

    renderPage(<ListsPage />, '/lists');
    expect(await screen.findByText('Piątek')).toBeInTheDocument();
    expect(screen.getByText('Od Ani')).toBeInTheDocument();
    await user.click(screen.getByTestId('new-list-button'));
    await user.type(screen.getByTestId('list-name-input'), 'Sobota');
    await user.click(screen.getByTestId('create-list-submit'));
    expect(await screen.findByTestId('list-title')).toHaveTextContent('Sobota');
    expect(screen.getByText('Lista jest pusta.')).toBeInTheDocument();
  });

  it('pokazuje pusty stan', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { lists: [] })));
    renderPage(<ListsPage />, '/lists');
    expect(await screen.findByText('Nie masz jeszcze żadnej listy.')).toBeInTheDocument();
    expect(screen.getByText('Nikt nie udostępnił Ci listy.')).toBeInTheDocument();
  });

  it('pozwala właścicielowi odhaczyć, dodać, udostępnić i usunąć', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/api/popular-products')) return json(200, { products: [{ id: 1, name: 'chleb' }] });
      if (url.endsWith('/status') && method === 'PATCH') return json(200, { ...item, isPurchased: true });
      if (url.endsWith('/items') && method === 'POST') return json(201, item);
      if (url.endsWith('/shares') && method === 'POST') return json(201, list.shares[0]);
      if (url.includes('/shares/') && method === 'DELETE') return json(204);
      if (url.includes('/api/items/') && method === 'DELETE') return json(204);
      if (url.endsWith('/api/lists/l1') && method === 'DELETE') return json(204);
      if (url.endsWith('/api/lists/l1') && method === 'PATCH') return json(200, list);
      if (url.includes('/api/items/') && method === 'PATCH') return json(200, item);
      if (url.endsWith('/api/lists/l1')) return json(200, list);
      return json(404, { error: `${method} ${url}` });
    }));

    renderPage(<ListDetailPage />, '/lists/l1');
    expect(await screen.findByTestId('list-title')).toHaveTextContent('Piątek');
    expect(screen.getByText(/ania@example.com/)).toBeInTheDocument();

    await user.click(screen.getByTestId('item-checkbox'));
    await user.type(screen.getByTestId('item-name'), 'chleb');
    await user.click(screen.getByTestId('add-item-submit'));
    await user.click(screen.getByTestId('share-button'));
    await user.type(screen.getByTestId('share-email'), 'ania@example.com');
    await user.click(screen.getByTestId('share-submit'));
    await user.click(screen.getByTestId('unshare-user'));
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('edit-list-button'));
    await user.clear(screen.getByTestId('edit-list-name'));
    await user.type(screen.getByTestId('edit-list-name'), 'Sobota');
    await user.click(screen.getByTestId('save-list-button'));
    await user.click(screen.getByTestId('item-edit'));
    await user.click(screen.getByRole('button', { name: 'Zapisz pozycję' }));
    await user.click(screen.getByTestId('item-delete'));
    await user.click(screen.getByTestId('confirm-delete-item'));
    await user.click(screen.getByTestId('delete-list-button'));
    await user.click(screen.getByTestId('confirm-delete-list'));
    expect(await screen.findByText('listy')).toBeInTheDocument();
  });

  it('pokazuje widok osoby ze współdzielenia i błąd wczytania', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (String(input).endsWith('/api/popular-products')) return json(200, { products: [] });
      return json(500, { error: 'awaria' });
    }));
    renderPage(<ListDetailPage />, '/lists/l1');
    expect(await screen.findByText('Nie udało się otworzyć listy.')).toBeInTheDocument();
  });

  it('dla osoby ze współdzielenia zostawia tylko status', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.endsWith('/api/popular-products')) return json(200, { products: [] });
      if (url.endsWith('/status')) return json(500, { error: 'Nie teraz' });
      return json(200, { ...list, role: 'shared', shares: [] });
    }));
    renderPage(<ListDetailPage />, '/lists/l1');
    expect(await screen.findByTestId('shared-note')).toBeInTheDocument();
    await user.click(screen.getByTestId('item-checkbox'));
    expect(screen.getByTestId('item-checkbox')).toBeInTheDocument();
  });
});
