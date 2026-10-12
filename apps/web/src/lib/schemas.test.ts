import { describe, expect, it } from 'vitest';
import { itemSchema } from '@/lib/schemas';

describe('schemat pozycji', () => {
  it('odrzuca jednostkę spoza listy', () => {
    const parsed = itemSchema.safeParse({ name: 'mleko', quantity: 1, unit: 'tona' });
    expect(parsed.success).toBe(false);
  });
});
