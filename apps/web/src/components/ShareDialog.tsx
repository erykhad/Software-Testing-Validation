import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Share } from '@/lib/types';

export function ShareDialog({
  shares,
  pending,
  onShare,
  onUnshare,
}: {
  shares: Share[];
  pending: boolean;
  onShare: (email: string) => Promise<void>;
  onUnshare: (userId: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" data-testid="share-button">
          <Share2 className="size-4" />
          Udostępnij
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Udostępnij listę</DialogTitle>
          <DialogDescription>
            Osoba z dostępem może odhaczać pozycje, ale nie zmienia ich ilości ani składu listy.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onShare(email)
              .then(() => setEmail(''))
              .catch(() => undefined);
          }}
        >
          <Label htmlFor="share-email">E-mail</Label>
          <Input
            id="share-email"
            data-testid="share-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" data-testid="share-submit" disabled={pending}>
            Udostępnij
          </Button>
        </form>
        <ul className="grid gap-2">
          {shares.length === 0 ? <li className="text-sm text-muted-foreground">Nikt jeszcze nie ma dostępu.</li> : null}
          {shares.map((share) => (
            <li key={share.userId} data-testid="share-user" className="flex items-center justify-between gap-3 text-sm">
              <span>
                {share.displayName}
                <span className="block text-muted-foreground">{share.email}</span>
              </span>
              <Button type="button" variant="ghost" data-testid="unshare-user" onClick={() => void onUnshare(share.userId)}>
                Odbierz
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
