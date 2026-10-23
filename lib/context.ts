import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import type { User } from '@/lib/domain/types';
import { createFormatter } from '@/lib/format';
import { TIME_ZONE } from '@/lib/time';

/** Everything a server component needs for one request. Cached per request. */
export const getContext = cache(async () => {
  const [db, user] = await Promise.all([getDb(), currentUser()]);
  return { db, user, now: new Date(), timeZone: TIME_ZONE, fmt: createFormatter(TIME_ZONE) };
});

export type RequestContext = Awaited<ReturnType<typeof getContext>>;

/** Pages for logged-in residents only: everyone else goes to the login page, then comes back. */
export async function requireUser(next: string): Promise<RequestContext & { user: User }> {
  const ctx = await getContext();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx as RequestContext & { user: User };
}
