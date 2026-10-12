import { z } from 'zod';
import { UNITS, validateQuantity } from './units.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Niepoprawna data');

export const registerSchema = z.object({
  email: z.string().trim().email('Podaj poprawny adres e-mail').max(200),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków').max(200),
  displayName: z.string().trim().min(1, 'Podaj nazwę').max(80, 'Nazwa jest za długa'),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Podaj adres e-mail').email('Podaj poprawny adres e-mail').max(200),
  password: z.string().min(1, 'Podaj hasło').max(200),
});

export const listNameSchema = z.string().trim().min(1, 'Podaj nazwę listy').max(120, 'Nazwa listy jest za długa');

export const createListSchema = z.object({
  name: listNameSchema,
  plannedDate: dateSchema.nullish(),
});

export const updateListSchema = z
  .object({
    name: listNameSchema.optional(),
    plannedDate: dateSchema.nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.plannedDate !== undefined, {
    message: 'Brak danych do zmiany',
  });

export const itemSchema = z.object({
  name: z.string().trim().min(1, 'Podaj nazwę produktu').max(120, 'Nazwa produktu jest za długa'),
  quantity: z.coerce.number().refine((value) => validateQuantity(value).ok, {
    message: 'Ilość musi być liczbą dodatnią nie większą niż 1000000',
  }),
  unit: z.enum(UNITS, { errorMap: () => ({ message: 'Wybierz jednostkę z listy' }) }),
});

export const updateItemSchema = itemSchema;

export const statusSchema = z.object({
  isPurchased: z.boolean({
    required_error: 'Podaj status zakupu',
    invalid_type_error: 'Status musi być wartością logiczną',
  }),
});

export const shareSchema = z.object({
  email: z.string().trim().email('Podaj poprawny adres e-mail').max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type StatusInput = z.infer<typeof statusSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
