import type { Context } from 'hono';
import { validateImage } from './domain/image.js';
import { HttpError } from './errors.js';
import type { AppEnv } from './app.js';
import type { ImagePayload } from './services/items.js';

export async function readUpload(value: unknown): Promise<ImagePayload | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 2 * 1024 * 1024) {
    throw new HttpError(400, 'Zdjęcie może mieć co najwyżej 2 MB');
  }
  const bytes = Buffer.from(await value.arrayBuffer());
  const result = validateImage(value.type, bytes);
  if (!result.ok) throw new HttpError(400, result.error);
  return { mime: value.type, bytes };
}

export async function readItemFields(c: Context<AppEnv>) {
  const contentType = c.req.header('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody();
    return {
      raw: {
        name: body.name,
        quantity: body.quantity,
        unit: body.unit,
      },
      image: await readUpload(body.image),
    };
  }
  return {
    raw: await c.req.json().catch(() => null),
    image: null,
  };
}
