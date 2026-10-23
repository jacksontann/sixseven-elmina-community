// Restores the sample community (places, residents, activities, workshops, posts) with fresh dates.
// Usage: npm run db:reset. Stop the app first when using the embedded database: PGlite allows one process per folder.
// Note: this also removes accounts created through the sign-up page.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { createPgliteDatabase } from '../lib/db/pglite';
import { createPostgresDatabase } from '../lib/db/postgres';
import { migrate } from '../lib/db/migrate';
import { seedDemo } from '../lib/demo/seed';
import { serverEnv } from '../lib/env';

loadEnvConfig(process.cwd());
const env = serverEnv();

async function main() {
  let db;
  if (env.DATABASE_URL) {
    db = await createPostgresDatabase(env.DATABASE_URL);
  } else {
    const dir = path.resolve(process.cwd(), env.DATA_DIR);
    mkdirSync(dir, { recursive: true });
    db = await createPgliteDatabase(dir);
  }
  try {
    const applied = await migrate(db);
    const counts = await seedDemo(db);
    console.log(`Migrations applied: ${applied.length ? applied.join(', ') : 'none pending'}`);
    console.log('Sample community restored:', counts);
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
