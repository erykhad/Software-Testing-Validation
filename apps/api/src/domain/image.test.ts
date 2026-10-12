import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateImage } from './image.js';

const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
);

describe('walidacja zdjęcia', () => {
  it('przyjmuje mały plik PNG', () => {
    expect(validateImage('image/png', PNG).ok).toBe(true);
  });

  it('odrzuca niedozwolony typ, zły podpis i zbyt duży plik', () => {
    expect(validateImage('text/plain', PNG).ok).toBe(false);
    expect(validateImage('image/png', Uint8Array.from([1, 2, 3, 4])).ok).toBe(false);
    expect(validateImage('image/png', new Uint8Array()).ok).toBe(false);
    const huge = new Uint8Array(MAX_IMAGE_BYTES + 1);
    huge.set(PNG.subarray(0, 8));
    expect(validateImage('image/png', huge).ok).toBe(false);
  });

  it('rozpoznaje podpisy JPEG i WebP', () => {
    expect(validateImage('image/jpeg', Uint8Array.of(0xff, 0xd8, 0xff)).ok).toBe(true);
    expect(validateImage('image/jpeg', Uint8Array.of(0x00, 0x00, 0x00)).ok).toBe(false);
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(validateImage('image/webp', webp).ok).toBe(true);
    expect(validateImage('image/webp', Uint8Array.of(0x52, 0x49, 0x46, 0x46)).ok).toBe(false);
  });
});
