import { describe, expect, it } from 'vitest';
import { sortItems, summarizeList } from './items.js';

describe('pozycje listy', () => {
  it('sortuje po pozycji, a przy remisie po dacie utworzenia', () => {
    const sorted = sortItems([
      { id: 'b', position: 2, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'c', position: 1, createdAt: '2026-02-01T00:00:00.000Z' },
      { id: 'a', position: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('podsumowuje kupione i pozostałe pozycje', () => {
    expect(
      summarizeList([{ isPurchased: true }, { isPurchased: false }, { isPurchased: true }]),
    ).toEqual({ total: 3, purchased: 2, remaining: 1 });
  });
});
