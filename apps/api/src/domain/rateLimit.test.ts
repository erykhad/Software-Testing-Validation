import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from './rateLimit.js';

describe('limit prób', () => {
  it('blokuje po przekroczeniu limitu w oknie i resetuje je po czasie', () => {
    const buckets = new Map();
    expect(consumeRateLimit(buckets, 'local', 1_000, 2, 500).allowed).toBe(true);
    expect(consumeRateLimit(buckets, 'local', 1_100, 2, 500).allowed).toBe(true);
    expect(consumeRateLimit(buckets, 'local', 1_200, 2, 500).allowed).toBe(false);
    expect(consumeRateLimit(buckets, 'local', 1_600, 2, 500).allowed).toBe(true);
  });
});
