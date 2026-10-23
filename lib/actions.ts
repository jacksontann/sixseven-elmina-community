import 'server-only';
import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import type { Database } from '@/lib/db/types';
import { DomainError, toErrorCode, type DomainErrorCode } from '@/lib/domain/errors';
import type { User } from '@/lib/domain/types';
import { takeToken } from '@/lib/rate-limit';

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

/**
 * Wraps a mutation by a logged-in user: the user comes from the session (never the client), each user is
 * rate-limited per action, and failures become a typed code with no stack trace or data leak.
 */
export async function runAction<T>(name: string, fn: (ctx: { db: Database; user: User; now: Date }) => Promise<T>, limit = { capacity: 30, perSecond: 1 }): Promise<ActionResult<T>> {
  try {
    const user = await currentUser();
    if (!user) throw new DomainError('UNAUTHENTICATED');
    if (!takeToken(`${user.id}:${name}`, limit.capacity, limit.perSecond)) throw new DomainError('RATE_LIMITED');
    return { ok: true, data: await fn({ db: await getDb(), user, now: new Date() }) };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

/** Sign-up and login: no user yet, so the rate-limit key is supplied (e.g. the email address). */
export async function runPublicAction<T>(name: string, key: string, fn: (ctx: { db: Database; now: Date }) => Promise<T>): Promise<ActionResult<T>> {
  try {
    if (!takeToken(`${name}:${key.toLowerCase()}`, 8, 0.1) || !takeToken(`${name}:all`, 120, 2)) throw new DomainError('RATE_LIMITED');
    return { ok: true, data: await fn({ db: await getDb(), now: new Date() }) };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
