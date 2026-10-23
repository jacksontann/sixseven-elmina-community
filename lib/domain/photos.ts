import sharp from 'sharp';
import type { Queryable } from '@/lib/db/types';
import { DomainError } from './errors';

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Every upload is decoded and written out as a new JPEG at a fixed shape, so cards always line up. */
const SHAPES = {
  avatar: { width: 400, height: 400 },
  post: { width: 1080, height: 1080 },
  cover: { width: 1600, height: 900 },
} as const;
export type PhotoKind = keyof typeof SHAPES;

/**
 * Validates and cleans an uploaded photo: JPEG, PNG or WebP only, under 5 MB, a single frame. The new file
 * keeps no EXIF/GPS, camera or colour-profile data (Sharp copies none unless asked); orientation is applied
 * first, then the image is centre-cropped to its kind's shape.
 */
export async function cleanPhoto(bytes: Uint8Array, kind: PhotoKind): Promise<{ image: Buffer; width: number; height: number }> {
  if (bytes.length === 0 || bytes.length > PHOTO_MAX_BYTES) throw new DomainError('BAD_PHOTO');
  try {
    const input = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'error' });
    const meta = await input.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '') || (meta.pages ?? 1) !== 1) throw new DomainError('BAD_PHOTO');
    const { width, height } = SHAPES[kind];
    const result = await input.rotate().resize({ width, height, fit: 'cover', position: 'attention' }).flatten({ background: '#ffffff' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    return { image: result.data, width: result.info.width, height: result.info.height };
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError('BAD_PHOTO');
  }
}

export async function storePhoto(db: Queryable, ownerId: string, kind: PhotoKind, bytes: Uint8Array): Promise<string> {
  const photo = await cleanPhoto(bytes, kind);
  return (await db.query<{ id: string }>('insert into photos (owner_id, kind, image, width, height) values ($1, $2, $3, $4, $5) returning id', [ownerId, kind, photo.image, photo.width, photo.height])).rows[0]!.id;
}
