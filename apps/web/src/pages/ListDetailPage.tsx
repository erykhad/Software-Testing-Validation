import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { AddItemForm, type NewItemInput } from '@/components/AddItemForm';
import { AppHeader } from '@/components/AppHeader';
import { DateField, formatPlannedDate } from '@/components/DateField';
import { ItemRow } from '@/components/ItemRow';
import { ShareDialog } from '@/components/ShareDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { UNITS } from '@/lib/schemas';
import type { PopularProduct, ShoppingItem, ShoppingList } from '@/lib/types';

export function ListDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);
  const [editingList, setEditingList] = useState(false);
  const [listName, setListName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ShoppingItem | null>(null);
  const [deleteList, setDeleteList] = useState(false);

  const list = useQuery({
    queryKey: ['list', id],
    queryFn: () => api<ShoppingList>(`/api/lists/${id}`),
  });
  const products = useQuery({
    queryKey: ['popular-products'],
    queryFn: () => api<{ products: PopularProduct[] }>('/api/popular-products'),
  });

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['list', id] }),
      queryClient.invalidateQueries({ queryKey: ['lists'] }),
    ]);
  }

  function onError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : 'Nie udało się zapisać zmiany');
  }

  const toggle = useMutation({
    mutationFn: (item: ShoppingItem) =>
      api(`/api/items/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isPurchased: !item.isPurchased }),
      }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ['list', id] });
      const previous = queryClient.getQueryData<ShoppingList>(['list', id]);
      queryClient.setQueryData<ShoppingList>(['list', id], (current) => {
        if (!current) return current;
        const items = current.items.map((entry) =>
          entry.id === item.id ? { ...entry, isPurchased: !entry.isPurchased } : entry,
        );
        const purchasedCount = items.filter((entry) => entry.isPurchased).length;
        return { ...current, items, purchasedCount };
      });
      return { previous };
    },
    onError: (error, _item, context) => {
      if (context?.previous) queryClient.setQueryData(['list', id], context.previous);
      onError(error);
    },
    onSettled: () => invalidate(),
  });

  const addItem = useMutation({
    mutationFn: async (input: NewItemInput) => {
      const form = new FormData();
      form.set('name', input.name);
      form.set('quantity', String(input.quantity));
      form.set('unit', input.unit);
      if (input.image) form.set('image', input.image);
      return api(`/api/lists/${id}/items`, { method: 'POST', body: form });
    },
    onSuccess: async () => {
      setFormKey((value) => value + 1);
      toast.success('Dodano pozycję');
      await invalidate();
    },
    onError,
  });

  const saveList = useMutation({
    mutationFn: () =>
      api(`/api/lists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: listName, plannedDate: plannedDate || null }),
      }),
    onSuccess: async () => {
      setEditingList(false);
      await invalidate();
    },
    onError,
  });

  const saveItem = useMutation({
    mutationFn: (item: ShoppingItem) =>
      api(`/api/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: item.name, quantity: item.quantity, unit: item.unit }),
      }),
    onSuccess: async () => {
      setEditingItem(null);
      await invalidate();
    },
    onError,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api(`/api/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleteItem(null);
      await invalidate();
    },
    onError,
  });

  const removeList = useMutation({
    mutationFn: () => api(`/api/lists/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
      navigate('/lists');
    },
    onError,
  });

  const share = useMutation({
    mutationFn: (email: string) =>
      api(`/api/lists/${id}/shares`, { method: 'POST', body: JSON.stringify({ email }) }),
    onSuccess: async () => {
      toast.success('Udostępniono listę');
      await invalidate();
    },
    onError,
  });

  const unshare = useMutation({
    mutationFn: (userId: string) => api(`/api/lists/${id}/shares/${userId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
    onError,
  });

  const data = list.data;
  const canEdit = data?.role === 'owner';

  return (
    <div>
      <AppHeader />
      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <Link to="/lists" className="text-sm text-muted-foreground">
          Wróć do list
        </Link>
        {list.isLoading ? <p>Wczytywanie listy…</p> : null}
        {list.isError ? <p className="text-destructive">Nie udało się otworzyć listy.</p> : null}
        {data ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 data-testid="list-title" className="text-2xl font-semibold tracking-tight">
                  {data.name}
                </h1>
                <p className="text-sm text-muted-foreground">{formatPlannedDate(data.plannedDate)}</p>
                <p className="mt-1 text-sm">
                  {data.purchasedCount}/{data.itemCount} kupione
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="edit-list-button"
                    onClick={() => {
                      setListName(data.name);
                      setPlannedDate(data.plannedDate ?? '');
                      setEditingList(true);
                    }}
                  >
                    Edytuj
                  </Button>
                  <ShareDialog
                    shares={data.shares}
                    pending={share.isPending}
                    onShare={async (email) => {
                      await share.mutateAsync(email);
                    }}
                    onUnshare={async (userId) => {
                      await unshare.mutateAsync(userId);
                    }}
                  />
                  <Button type="button" variant="destructive" data-testid="delete-list-button" onClick={() => setDeleteList(true)}>
                    Usuń listę
                  </Button>
                </div>
              ) : (
                <p data-testid="shared-note" className="max-w-xs text-sm text-muted-foreground">
                  Możesz zmieniać tylko status pozycji.
                </p>
              )}
            </div>
            {canEdit && data.shares.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Współdzielona z:{' '}
                {data.shares.map((entry) => entry.email).join(', ')}
              </p>
            ) : null}
            {canEdit ? (
              <section className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 font-medium">Dodaj pozycję</h2>
                <AddItemForm
                  key={formKey}
                  products={products.data?.products ?? []}
                  pending={addItem.isPending}
                  onSubmit={(input) => addItem.mutate(input)}
                />
              </section>
            ) : null}
            {data.items.length === 0 ? <p className="text-sm text-muted-foreground">Lista jest pusta.</p> : null}
            <ul className="divide-y">
              {data.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onToggle={() => toggle.mutate(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => setDeleteItem(item)}
                />
              ))}
            </ul>
          </>
        ) : null}
      </main>

      <Dialog open={editingList} onOpenChange={setEditingList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj listę</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveList.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-list-name">Nazwa</Label>
              <Input id="edit-list-name" data-testid="edit-list-name" value={listName} onChange={(event) => setListName(event.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Data zakupów</Label>
              <DateField value={plannedDate} onChange={setPlannedDate} />
            </div>
            <Button type="submit" data-testid="save-list-button" disabled={saveList.isPending}>
              Zapisz
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj pozycję</DialogTitle>
          </DialogHeader>
          {editingItem ? (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveItem.mutate(editingItem);
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="edit-item-name">Nazwa</Label>
                <Input
                  id="edit-item-name"
                  value={editingItem.name}
                  onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-item-quantity">Ilość</Label>
                  <Input
                    id="edit-item-quantity"
                    type="number"
                    min="0"
                    step="any"
                    value={editingItem.quantity}
                    onChange={(event) => setEditingItem({ ...editingItem, quantity: Number(event.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Jednostka</Label>
                  <Select value={editingItem.unit} onValueChange={(unit) => setEditingItem({ ...editingItem, unit })}>
                    <SelectTrigger aria-label="Jednostka pozycji">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={saveItem.isPending}>
                Zapisz pozycję
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć pozycję?</AlertDialogTitle>
            <AlertDialogDescription>Pozycja {deleteItem?.name} zniknie z listy.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-item" onClick={() => deleteItem && removeItem.mutate(deleteItem.id)}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteList} onOpenChange={setDeleteList}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć listę?</AlertDialogTitle>
            <AlertDialogDescription>Lista i wszystkie pozycje zostaną usunięte.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-list" onClick={() => removeList.mutate()}>
              Usuń listę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
