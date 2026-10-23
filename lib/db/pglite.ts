import { PGlite } from '@electric-sql/pglite';
import type { Database, Queryable } from './types';

/**
 * Embedded PostgreSQL (WebAssembly) for local and demo use.
 * `dataDir` persists to disk; omit it for a throwaway in-memory database (tests).
 * PGlite is single-connection: transactions are serialised inside the process.
 */
export async function createPgliteDatabase(dataDir?: string): Promise<Database> {
  const pg = await PGlite.create(dataDir);

  const wrap = (target: Pick<PGlite, 'query' | 'exec'>): Queryable => ({
    async query<T>(sql: string, params?: readonly unknown[]) {
      const result = await target.query<T>(sql, params ? [...params] : undefined);
      return { rows: result.rows };
    },
    async exec(sql: string) {
      await target.exec(sql);
    },
  });

  const base = wrap(pg);
  return {
    kind: 'pglite',
    query: base.query,
    exec: base.exec,
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
    close: () => pg.close(),
  };
}
