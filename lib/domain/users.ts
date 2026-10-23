import type { Queryable } from '@/lib/db/types';
import { DomainError } from './errors';
import { hashPassword, verifyPassword } from './passwords';
import { AREAS, type Area, type PublicProfile, type User } from './types';

interface UserRow {
  id: string;
  email: string;
  name: string;
  area: Area;
  bio: string;
  avatar_photo_id: string | null;
  role: 'resident' | 'organiser';
  organiser_title: string | null;
  is_sample: boolean;
}
const USER_COLUMNS = 'id, email, name, area, bio, avatar_photo_id, role, organiser_title, is_sample';
const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, name: r.name, area: r.area, bio: r.bio, avatarPhotoId: r.avatar_photo_id, role: r.role, organiserTitle: r.organiser_title, isSample: r.is_sample });
export const toPublic = (u: User | PublicProfile): PublicProfile => ({ id: u.id, name: u.name, area: u.area, bio: u.bio, avatarPhotoId: u.avatarPhotoId, role: u.role, organiserTitle: u.organiserTitle, isSample: u.isSample });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignUpInput { name: string; email: string; password: string; houseAddress: string; area: string; acceptedTerms: boolean; }

/** Creates a resident account. The house address is required, stored privately and never shown to anyone. */
export async function signUp(db: Queryable, input: SignUpInput): Promise<User> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const houseAddress = input.houseAddress.trim();
  if (name.length < 1 || name.length > 60) throw new DomainError('VALIDATION_ERROR', 'name');
  if (!EMAIL.test(email) || email.length > 254) throw new DomainError('VALIDATION_ERROR', 'email');
  if (input.password.length < 8 || input.password.length > 200) throw new DomainError('VALIDATION_ERROR', 'password');
  if (houseAddress.length < 5 || houseAddress.length > 200) throw new DomainError('VALIDATION_ERROR', 'address');
  if (!AREAS.includes(input.area as Area)) throw new DomainError('VALIDATION_ERROR', 'area');
  if (!input.acceptedTerms) throw new DomainError('VALIDATION_ERROR', 'terms');
  if ((await db.query('select 1 from users where email = $1', [email])).rows.length) throw new DomainError('EMAIL_TAKEN');
  const hash = await hashPassword(input.password);
  try {
    const row = (await db.query<UserRow>(`insert into users (email, password_hash, name, area, house_address) values ($1, $2, $3, $4, $5) returning ${USER_COLUMNS}`, [email, hash, name, input.area, houseAddress])).rows[0]!;
    return toUser(row);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new DomainError('EMAIL_TAKEN');
    throw error;
  }
}

/** Checks a login. Always the same error whether the email or the password was wrong. */
export async function logIn(db: Queryable, emailInput: string, password: string): Promise<User> {
  const email = emailInput.trim().toLowerCase();
  const row = (await db.query<UserRow & { password_hash: string }>(`select ${USER_COLUMNS}, password_hash from users where email = $1`, [email])).rows[0];
  // Hash anyway when the account doesn't exist, so response time doesn't reveal which emails are registered.
  const ok = row ? await verifyPassword(password, row.password_hash) : (await hashPassword(password), false);
  if (!row || !ok) throw new DomainError('BAD_CREDENTIALS');
  return toUser(row);
}

export async function getUser(db: Queryable, id: string): Promise<User | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<UserRow>(`select ${USER_COLUMNS} from users where id = $1`, [id])).rows[0];
  return row ? toUser(row) : null;
}

export async function getProfile(db: Queryable, id: string): Promise<PublicProfile | null> {
  const user = await getUser(db, id);
  return user ? toPublic(user) : null;
}

/** The owner's own private details (shown only on their Edit profile page). */
export async function getOwnAddress(db: Queryable, userId: string): Promise<string> {
  return (await db.query<{ house_address: string }>('select house_address from users where id = $1', [userId])).rows[0]?.house_address ?? '';
}

export async function updateProfile(db: Queryable, user: User, input: { name: string; bio: string; area: string; houseAddress?: string; avatarPhotoId?: string | null }): Promise<void> {
  const name = input.name.trim();
  const bio = input.bio.trim();
  if (name.length < 1 || name.length > 60 || bio.length > 300 || !AREAS.includes(input.area as Area)) throw new DomainError('VALIDATION_ERROR');
  const address = input.houseAddress?.trim();
  if (address !== undefined && (address.length < 5 || address.length > 200)) throw new DomainError('VALIDATION_ERROR', 'address');
  await db.query(
    `update users set name = $2, bio = $3, area = $4, house_address = coalesce($5, house_address),
            avatar_photo_id = case when $6::boolean then $7::uuid else avatar_photo_id end where id = $1`,
    [user.id, name, bio, input.area, address ?? null, input.avatarPhotoId !== undefined, input.avatarPhotoId ?? null],
  );
}

export interface ProfileStats { posts: number; joined: number; hosting: number; }
export async function profileStats(db: Queryable, userId: string, now: Date): Promise<ProfileStats> {
  return (await db.query<ProfileStats>(
    `select (select count(*)::int from posts where author_id = $1) as posts,
            (select count(*)::int from event_participants p join events e on e.id = p.event_id where p.user_id = $1 and e.cancelled_at is null) as joined,
            (select count(*)::int from events where host_id = $1 and cancelled_at is null and ends_at > $2) as hosting`,
    [userId, now],
  )).rows[0]!;
}
