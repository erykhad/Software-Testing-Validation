export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateImage(
  mime: string,
  bytes: Uint8Array,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: 'Dozwolone formaty zdjęć: JPEG, PNG i WebP' };
  }
  if (bytes.byteLength === 0) {
    return { ok: false, error: 'Plik zdjęcia jest pusty' };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Zdjęcie może mieć co najwyżej 2 MB' };
  }
  if (!matchesMagic(mime, bytes)) {
    return { ok: false, error: 'Zawartość pliku nie pasuje do deklarowanego formatu' };
  }
  return { ok: true };
}

function matchesMagic(mime: string, bytes: Uint8Array): boolean {
  if (mime === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}
