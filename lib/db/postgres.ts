import pg from 'pg';
import type { Database, Queryable } from './types';

// Match PGlite: int8 (count/bigint identity) as JavaScript numbers. Values stay far below 2^53 here.
pg.types.setTypeParser(20, (value: string) => Number(value));

/** Hosted PostgreSQL (for example a Supabase project) through node-postgres. Server-only. */
export async function createPostgresDatabase(connectionString: string): Promise<Database> {
  const pool = new pg.Pool({ connectionString, max: 10 });

  const wrap = (client: pg.Pool | pg.PoolClient): Queryable => ({
    async query<T>(sql: string, params?: readonly unknown[]) {
      const result = await client.query(sql, params ? [...params] : undefined);
      return { rows: result.rows as T[] };
    },
    async exec(sql: string) {
      await client.query(sql);
    },
  });

  const base = wrap(pool);
  return {
    kind: 'postgres',
    query: base.query,
    exec: base.exec,
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const result = await fn(wrap(client));
        await client.query('commit');
        return result;
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
