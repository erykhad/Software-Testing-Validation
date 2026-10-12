import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { formatPlannedDate, DateField } from '@/components/DateField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import type { ShoppingList, ShoppingListSummary } from '@/lib/types';

export function ListsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const lists = useQuery({
    queryKey: ['lists'],
    queryFn: () => api<{ lists: ShoppingListSummary[] }>('/api/lists'),
  });

  const create = useMutation({
    mutationFn: () =>
      api<ShoppingList>('/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name, plannedDate: plannedDate || null }),
      }),
    onSuccess: async (list) => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
      setOpen(false);
      setName('');
      setPlannedDate('');
      navigate(`/lists/${list.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Nie udało się utworzyć listy');
    },
  });

  const owned = lists.data?.lists.filter((list) => list.role === 'owner') ?? [];
  const shared = lists.data?.lists.filter((list) => list.role === 'shared') ?? [];

  return (
    <div>
      <AppHeader />
      <main data-testid="lists-page" className="mx-auto grid max-w-3xl gap-8 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Twoje listy</h1>
            <p className="text-sm text-muted-foreground">Zaplanuj zakupy i odhaczaj to, co już jest w koszyku.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" data-testid="new-list-button">
                Nowa lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowa lista</DialogTitle>
                <DialogDescription>Nazwa i sugerowana data zakupów.</DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  create.mutate();
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="list-name">Nazwa</Label>
                  <Input id="list-name" data-testid="list-name-input" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="list-planned-date">Data zakupów</Label>
                  <DateField id="list-planned-date" value={plannedDate} onChange={setPlannedDate} />
                </div>
                <Button type="submit" data-testid="create-list-submit" disabled={create.isPending}>
                  Utwórz
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <ListSection title="Moje listy" lists={owned} empty="Nie masz jeszcze żadnej listy." />
        <ListSection title="Udostępnione mnie" lists={shared} empty="Nikt nie udostępnił Ci listy." />
      </main>
    </div>
  );
}

function ListSection({ title, lists, empty }: { title: string; lists: ShoppingListSummary[]; empty: string }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {lists.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : null}
      <div className="grid gap-3">
        {lists.map((list) => (
          <Link key={list.id} to={`/lists/${list.id}`} data-testid="list-card">
            <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40">
              <div>
                <p className="font-medium">{list.name}</p>
                <p className="text-sm text-muted-foreground">{formatPlannedDate(list.plannedDate)}</p>
              </div>
              <Badge>
                {list.purchasedCount}/{list.itemCount}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
