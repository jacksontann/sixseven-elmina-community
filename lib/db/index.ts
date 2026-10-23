import 'server-only';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { ensureSeeded } from '@/lib/demo/seed';
import { serverEnv } from '@/lib/env';
import { migrate } from './migrate';
import { createPgliteDatabase } from './pglite';
import { createPostgresDatabase } from './postgres';
import type { Database } from './types';

type GlobalWithDb = typeof globalThis & { __elminaDb?: Promise<Database> };

/**
 * One database handle per server process (survives dev hot reloads). The first call applies pending
 * migrations and adds the sample community on the very first start.
 */
export function getDb(): Promise<Database> {
  const g = globalThis as GlobalWithDb;
  if (!g.__elminaDb) {
    g.__elminaDb = open().catch((error: unknown) => {
      g.__elminaDb = undefined;
      throw error;
    });
  }
  return g.__elminaDb;
}

async function open(): Promise<Database> {
  const env = serverEnv();
  let db: Database;
  if (env.DATABASE_URL) {
    db = await createPostgresDatabase(env.DATABASE_URL);
  } else {
    // Runtime data directory, intentionally outside the build trace.
    const dir = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.DATA_DIR);
    mkdirSync(dir, { recursive: true });
    db = await createPgliteDatabase(dir);
  }
  await migrate(db);
  await ensureSeeded(db);
  return db;
}
