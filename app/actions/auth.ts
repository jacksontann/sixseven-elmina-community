'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { runPublicAction, type ActionResult } from '@/lib/actions';
import { endSession, startSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { logIn, signUp } from '@/lib/domain/users';

type State = ActionResult<unknown> | null;
const str = (data: FormData, key: string) => String(data.get(key) ?? '');
/** Only same-site relative paths are allowed as a post-login destination. */
const safeNext = (value: string) => (/^\/(?!\/)[\w\-/?=&%.]*$/.test(value) ? value : '/');

export async function signUpAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runPublicAction('signup', str(data, 'email'), async ({ db }) => {
    const user = await signUp(db, { name: str(data, 'name'), email: str(data, 'email'), password: str(data, 'password'), houseAddress: str(data, 'houseAddress'), area: str(data, 'area'), acceptedTerms: data.get('terms') === 'on' });
    await startSession(user.id);
    return user.id;
  });
  if (result.ok) redirect('/welcome');
  return result;
}

export async function logInAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runPublicAction('login', str(data, 'email'), async ({ db }) => {
    const user = await logIn(db, str(data, 'email'), str(data, 'password'));
    await startSession(user.id);
    return user.id;
  });
  if (result.ok) { revalidatePath('/', 'layout'); redirect(safeNext(str(data, 'next'))); }
  return result;
}

/** One-click sample accounts for the demo (fictional people; their password is shown on the login page). */
export async function demoLogInAction(data: FormData): Promise<void> {
  const account = str(data, 'account');
  if (!['aina', 'drsiti'].includes(account)) return;
  const row = (await (await getDb()).query<{ id: string }>('select id from users where email = $1 and is_sample', [`${account}@example.com`])).rows[0];
  if (!row) return;
  await startSession(row.id);
  revalidatePath('/', 'layout');
  redirect(safeNext(str(data, 'next')));
}

export async function logOutAction(): Promise<void> {
  await endSession();
  revalidatePath('/', 'layout');
  redirect('/');
}
