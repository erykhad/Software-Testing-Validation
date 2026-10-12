import { describe, expect, it } from 'vitest';
import { isUnit, UNITS, validateQuantity } from './units.js';

describe('jednostki i ilość', () => {
  it('akceptuje jednostki z listy', () => {
    for (const unit of UNITS) {
      expect(isUnit(unit)).toBe(true);
    }
    expect(isUnit('tona')).toBe(false);
    expect(isUnit('')).toBe(false);
  });

  it('odrzuca ilość niedodatnią, nieliczbową i zbyt dużą', () => {
    expect(validateQuantity(1).ok).toBe(true);
    expect(validateQuantity(1.5).ok).toBe(true);
    expect(validateQuantity(0).ok).toBe(false);
    expect(validateQuantity(-2).ok).toBe(false);
    expect(validateQuantity(Number.NaN).ok).toBe(false);
    expect(validateQuantity(Number.POSITIVE_INFINITY).ok).toBe(false);
    expect(validateQuantity(1_000_001).ok).toBe(false);
  });
});
