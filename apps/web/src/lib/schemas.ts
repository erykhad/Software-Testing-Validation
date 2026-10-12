import { z } from 'zod';

export const UNITS = ['szt', 'g', 'kg', 'ml', 'l', 'opak'] as const;

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Podaj adres e-mail').email('Podaj poprawny adres e-mail'),
  password: z.string().min(1, 'Podaj hasło'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('Podaj poprawny adres e-mail'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  displayName: z.string().trim().min(1, 'Podaj nazwę').max(80, 'Nazwa jest za długa'),
});

export const itemSchema = z.object({
  name: z.string().trim().min(1, 'Podaj nazwę produktu').max(120, 'Nazwa produktu jest za długa'),
  quantity: z.coerce.number().positive('Ilość musi być większa od zera').max(1_000_000, 'Ilość jest za duża'),
  unit: z.enum(UNITS, { errorMap: () => ({ message: 'Wybierz jednostkę z listy' }) }),
});
