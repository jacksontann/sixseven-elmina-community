import { createPgliteDatabase } from '@/lib/db/pglite';
import { migrate } from '@/lib/db/migrate';
import type { Database } from '@/lib/db/types';
import { seedDemo } from '@/lib/demo/seed';
import { getUser } from '@/lib/domain/users';
import type { User } from '@/lib/domain/types';

export const NOW = new Date('2026-10-24T08:00:00+08:00');

/** A throwaway in-memory PostgreSQL (PGlite) with the migration applied. */
export async function freshDb(): Promise<Database> {
  const db = await createPgliteDatabase();
  await migrate(db);
  return db;
}

/** A fresh database with the labelled sample community, seeded relative to NOW. */
export async function seededDb(): Promise<Database> {
  const db = await freshDb();
  await seedDemo(db, NOW);
  return db;
}

export async function sampleUser(db: Database, key: string): Promise<User> {
  const id = (await db.query<{ id: string }>('select id from users where email = $1', [`${key}@example.com`])).rows[0]!.id;
  return (await getUser(db, id))!;
}

export async function eventId(db: Database, titleLike: string): Promise<string> {
  return (await db.query<{ id: string }>('select id from events where title ilike $1', [`%${titleLike}%`])).rows[0]!.id;
}
