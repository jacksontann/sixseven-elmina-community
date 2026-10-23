export interface QueryResult<T> {
  rows: T[];
}

/** Anything that can run a parameterised statement: the database itself or an open transaction. */
export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  /** Runs one or more statements without parameters (migrations, seed scripts). */
  exec(sql: string): Promise<void>;
}

export interface Database extends Queryable {
  readonly kind: 'pglite' | 'postgres';
  /** Runs `fn` in a single transaction. Throwing inside rolls everything back. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
