import { describe, expect, it } from 'vitest';
import { createListSchema, itemSchema, registerSchema, updateListSchema } from './schemas.js';

describe('schematy walidacji', () => {
  it('przyjmuje poprawną rejestrację i odrzuca krótkie hasło', () => {
    expect(
      registerSchema.safeParse({
        email: 'jan@example.com',
        password: 'haslo1234',
        displayName: 'Jan',
      }).success,
    ).toBe(true);
    const invalid = registerSchema.safeParse({
      email: 'jan@example.com',
      password: 'krotkie',
      displayName: 'Jan',
    });
    expect(invalid.success).toBe(false);
  });

  it('odrzuca nieistniejącą datę listy', () => {
    expect(createListSchema.safeParse({ name: 'Zakupy', plannedDate: '2026-02-31' }).success).toBe(false);
    expect(createListSchema.safeParse({ name: 'Zakupy', plannedDate: '2026-10-12' }).success).toBe(true);
    expect(updateListSchema.safeParse({}).success).toBe(false);
  });

  it('wymaga jednostki z listy i dodatniej ilości', () => {
    expect(itemSchema.safeParse({ name: 'mleko', quantity: '2', unit: 'l' }).success).toBe(true);
    expect(itemSchema.safeParse({ name: 'mleko', quantity: 0, unit: 'l' }).success).toBe(false);
    expect(itemSchema.safeParse({ name: 'mleko', quantity: 1, unit: 'tona' }).success).toBe(false);
  });
});
