import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

/** Uploaded photos are for logged-in residents only. They never change, so browsers may cache them. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await currentUser())) return new Response('Not found', { status: 404 });
  const row = (await (await getDb()).query<{ image: Uint8Array }>('select image from photos where id = $1', [id])).rows[0];
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(row.image), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" },
  });
}
