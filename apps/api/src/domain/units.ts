export const UNITS = ['szt', 'g', 'kg', 'ml', 'l', 'opak'] as const;

export type Unit = (typeof UNITS)[number];

const MAX_QUANTITY = 1_000_000;

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

export function validateQuantity(quantity: number): { ok: true } | { ok: false; error: string } {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
    return {
      ok: false,
      error: 'Ilość musi być liczbą dodatnią nie większą niż 1000000',
    };
  }
  return { ok: true };
}
