import 'server-only';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serverEnv } from '@/lib/env';

let cached: string | undefined;

/**
 * Server-only session signing secret. A configured SESSION_SECRET wins; otherwise a random one is generated
 * once into `.data/secrets.json` (git-ignored) so a fresh clone works without any configuration.
 */
export function sessionSecret(): string {
  if (cached) return cached;
  const configured = serverEnv().SESSION_SECRET;
  if (configured) return (cached = configured);
  const dir = path.resolve(/* turbopackIgnore: true */ process.cwd(), '.data');
  const file = path.join(dir, 'secrets.json');
  const saved = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { sessionSecret?: string }) : {};
  if (saved.sessionSecret) return (cached = saved.sessionSecret);
  const secret = randomBytes(32).toString('base64url');
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify({ ...saved, sessionSecret: secret }), { mode: 0o600 });
  return (cached = secret);
}
