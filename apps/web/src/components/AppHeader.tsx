import { LogOut, ShoppingBasket } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-card/80">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link to="/lists" className="flex items-center gap-2 font-semibold">
          <ShoppingBasket className="size-5 text-primary" />
          Listy zakupów
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.displayName}</span>
          <Button
            type="button"
            variant="ghost"
            data-testid="logout-button"
            onClick={() => {
              void logout().then(() => navigate('/login'));
            }}
          >
            <LogOut className="size-4" />
            Wyloguj
          </Button>
        </div>
      </div>
    </header>
  );
}
