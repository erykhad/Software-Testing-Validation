import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { registerSchema } from '@/lib/schemas';

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Załóż konto</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit(async (values) => {
                setError(null);
                try {
                  await register(values);
                  navigate('/lists');
                } catch (caught) {
                  setError(caught instanceof ApiError ? caught.message : 'Nie udało się utworzyć konta');
                }
              })}
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa</FormLabel>
                    <FormControl>
                      <Input data-testid="register-name" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input data-testid="register-email" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <Input data-testid="register-password" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error ? (
                <p data-testid="register-error" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" data-testid="register-submit" disabled={form.formState.isSubmitting}>
                Utwórz konto
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-sm text-muted-foreground">
            Masz już konto?{' '}
            <Link to="/login" className="font-medium text-primary">
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
