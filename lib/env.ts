import { z } from 'zod';

// Blank values in .env files mean "not configured".
const optional = z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().optional());
const withDefault = (fallback: string) => z.preprocess((v) => (v === '' ? undefined : v), z.string().default(fallback));

const schema = z.object({
  /** Embedded PostgreSQL (PGlite) directory. Ignored when DATABASE_URL is set. */
  DATA_DIR: withDefault('.data/elmina-demo'),
  DATABASE_URL: optional,
  SESSION_SECRET: optional,
  NEXT_PUBLIC_APP_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().default('http://localhost:3000')),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    cached = parsed.data;
  }
  return cached;
}
