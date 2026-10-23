import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { getDb } from '@/lib/db';
import { getUser } from '@/lib/domain/users';
import type { User } from '@/lib/domain/types';
import { serverEnv } from '@/lib/env';
import { sessionSecret } from '@/lib/secrets';
import { signToken, verifyToken } from './token';

const COOKIE = 'elmina_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionPayload { v: 2; u: string; iat: number; }

/** Signed, HttpOnly cookie that only says who is logged in. The user's details are always re-read from the database. */
export async function startSession(userId: string): Promise<void> {
  const token = signToken({ v: 2, u: userId, iat: Date.now() } satisfies SessionPayload, sessionSecret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: serverEnv().NEXT_PUBLIC_APP_URL.startsWith('https://'), path: '/', maxAge: MAX_AGE_SECONDS });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The logged-in user for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const payload = verifyToken<SessionPayload>((await cookies()).get(COOKIE)?.value, sessionSecret());
  if (!payload || payload.v !== 2 || Date.now() - payload.iat > MAX_AGE_SECONDS * 1000) return null;
  return getUser(await getDb(), payload.u);
});
