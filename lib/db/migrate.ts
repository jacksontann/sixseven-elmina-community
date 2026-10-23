import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from './types';

export const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

/** Applies every not-yet-applied `supabase/migrations/*.sql` file in name order, one transaction each. */
export async function migrate(db: Database, dir: string = MIGRATIONS_DIR): Promise<string[]> {
  await db.exec(
    'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
  );
  const applied = new Set((await db.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name));
  const files = readdirSync(/* turbopackIgnore: true */ dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const newlyApplied: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const fullPath = path.join(/* turbopackIgnore: true */ dir, file);
    const sql = readFileSync(/* turbopackIgnore: true */ fullPath, 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query('insert into schema_migrations (name) values ($1)', [file]);
    });
    newlyApplied.push(file);
  }
  return newlyApplied;
}
