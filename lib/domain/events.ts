import type { Database, Queryable } from '@/lib/db/types';
import { DAY_MS, HOUR_MS, MINUTE_MS, monthKey } from '@/lib/time';
import { DomainError } from './errors';
import { ACTIVITY_CATEGORIES, WORKSHOP_TOPICS, type ActivityCategory, type EventType, type PublicProfile, type User, type WorkshopTopic } from './types';

export interface EventSummary {
  id: string;
  type: EventType;
  title: string;
  description: string;
  category: string;
  isMonthlyClimate: boolean;
  host: Pick<PublicProfile, 'id' | 'name' | 'avatarPhotoId' | 'role' | 'organiserTitle'>;
  placeName: string;
  placeArea: string;
  startsAt: Date;
  endsAt: Date;
  spots: number;
  taken: number;
  coverPhotoId: string | null;
  coverImage: string | null;
  cancelled: boolean;
  viewerJoined: boolean;
}

interface EventRow {
  id: string; type: EventType; title: string; description: string; category: string; is_monthly_climate: boolean;
  host_id: string; host_name: string; host_avatar: string | null; host_role: 'resident' | 'organiser'; host_title: string | null;
  place_name: string; place_area: string; starts_at: Date; ends_at: Date; spots: number; taken: number;
  cover_photo_id: string | null; cover_image: string | null; cancelled_at: Date | null; viewer_joined: boolean;
}

const SELECT = `
  select e.id, e.type, e.title, e.description, e.category, e.is_monthly_climate, e.host_id,
         h.name as host_name, h.avatar_photo_id as host_avatar, h.role as host_role, h.organiser_title as host_title,
         pl.name as place_name, pl.area as place_area, e.starts_at, e.ends_at, e.spots,
         (select count(*)::int from event_participants p where p.event_id = e.id) as taken,
         e.cover_photo_id, e.cover_image, e.cancelled_at,
         exists (select 1 from event_participants p where p.event_id = e.id and p.user_id = $1) as viewer_joined
    from events e join users h on h.id = e.host_id join places pl on pl.id = e.place_id`;

const toEvent = (r: EventRow): EventSummary => ({
  id: r.id, type: r.type, title: r.title, description: r.description, category: r.category, isMonthlyClimate: r.is_monthly_climate,
  host: { id: r.host_id, name: r.host_name, avatarPhotoId: r.host_avatar, role: r.host_role, organiserTitle: r.host_title },
  placeName: r.place_name, placeArea: r.place_area, startsAt: r.starts_at, endsAt: r.ends_at, spots: r.spots, taken: r.taken,
  coverPhotoId: r.cover_photo_id, coverImage: r.cover_image, cancelled: r.cancelled_at !== null, viewerJoined: r.viewer_joined,
});

export const spotsLeft = (e: EventSummary) => Math.max(0, e.spots - e.taken);

/** Upcoming (not yet ended, not cancelled) activities or workshops, soonest first, with optional search. */
export async function listEvents(db: Queryable, viewerId: string, now: Date, options: { type: EventType; category?: string; q?: string; monthlyClimate?: boolean; limit?: number }): Promise<EventSummary[]> {
  const params: unknown[] = [viewerId, options.type, now];
  const where = ['e.type = $2', 'e.cancelled_at is null', 'e.ends_at > $3'];
  if (options.category) { params.push(options.category); where.push(`e.category = $${params.length}`); }
  if (options.monthlyClimate !== undefined) { params.push(options.monthlyClimate); where.push(`e.is_monthly_climate = $${params.length}`); }
  const q = options.q?.trim().slice(0, 80);
  if (q) {
    params.push(`%${q.replace(/[%_\\]/g, '')}%`);
    where.push(`(e.title ilike $${params.length} or e.description ilike $${params.length} or e.category ilike $${params.length} or pl.name ilike $${params.length} or pl.area ilike $${params.length} or h.name ilike $${params.length})`);
  }
  params.push(Math.min(options.limit ?? 60, 200));
  const rows = await db.query<EventRow>(`${SELECT} where ${where.join(' and ')} order by e.starts_at, e.id limit $${params.length}`, params);
  return rows.rows.map(toEvent);
}

export async function getEvent(db: Queryable, viewerId: string, id: string): Promise<EventSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = (await db.query<EventRow>(`${SELECT} where e.id = $2`, [viewerId, id])).rows[0];
  return row ? toEvent(row) : null;
}

/** Who's going: first names and avatars of participants (all are logged-in residents). */
export async function participants(db: Queryable, eventId: string): Promise<Pick<PublicProfile, 'id' | 'name' | 'avatarPhotoId'>[]> {
  const rows = await db.query<{ id: string; name: string; avatar_photo_id: string | null }>(
    'select u.id, u.name, u.avatar_photo_id from event_participants p join users u on u.id = p.user_id where p.event_id = $1 order by p.joined_at',
    [eventId],
  );
  return rows.rows.map((r) => ({ id: r.id, name: r.name, avatarPhotoId: r.avatar_photo_id }));
}

export interface CreateEventInput {
  type: EventType;
  title: string;
  description: string;
  category: string;
  isMonthlyClimate?: boolean;
  placeId: string;
  startsAt: Date;
  endsAt: Date;
  spots: number;
  coverPhotoId?: string | null;
}

/** Anyone can host an activity; only organisers can host a workshop. Both go live immediately. */
export async function createEvent(db: Queryable, user: User, input: CreateEventInput, now: Date): Promise<string> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3 || title.length > 90 || description.length > 1500) throw new DomainError('VALIDATION_ERROR', 'text');
  if (input.type === 'workshop') {
    if (user.role !== 'organiser') throw new DomainError('FORBIDDEN', 'only organisers host workshops');
    if (!WORKSHOP_TOPICS.includes(input.category as WorkshopTopic)) throw new DomainError('VALIDATION_ERROR', 'topic');
    if (input.isMonthlyClimate && input.category !== 'Climate') throw new DomainError('VALIDATION_ERROR', 'climate theme');
  } else {
    if (!ACTIVITY_CATEGORIES.includes(input.category as ActivityCategory)) throw new DomainError('VALIDATION_ERROR', 'category');
    if (input.isMonthlyClimate) throw new DomainError('VALIDATION_ERROR', 'climate theme');
  }
  const maxSpots = input.type === 'workshop' ? 200 : 50;
  if (!Number.isInteger(input.spots) || input.spots < 2 || input.spots > maxSpots) throw new DomainError('VALIDATION_ERROR', 'spots');
  const start = input.startsAt.getTime(), end = input.endsAt.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 8 * HOUR_MS) throw new DomainError('VALIDATION_ERROR', 'time');
  if (start < now.getTime() + 15 * MINUTE_MS || start > now.getTime() + 120 * DAY_MS) throw new DomainError('VALIDATION_ERROR', 'time');
  if (!(await db.query('select 1 from places where id = $1', [input.placeId])).rows.length) throw new DomainError('VALIDATION_ERROR', 'place');
  return (await db.query<{ id: string }>(
    `insert into events (type, title, description, category, is_monthly_climate, host_id, place_id, starts_at, ends_at, spots, cover_photo_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
    [input.type, title, description, input.category, Boolean(input.isMonthlyClimate), user.id, input.placeId, input.startsAt, input.endsAt, input.spots, input.coverPhotoId ?? null],
  )).rows[0]!.id;
}

/**
 * One tap to join. The event row is locked first, so simultaneous taps are counted one at a time and a full
 * event never takes extra people (the database trigger is a second guard). A repeated tap changes nothing.
 */
export async function joinEvent(db: Database, user: User, eventId: string, now: Date): Promise<'joined' | 'already'> {
  return db.transaction(async (tx) => {
    const e = (await tx.query<{ host_id: string; ends_at: Date; spots: number; cancelled_at: Date | null }>('select host_id, ends_at, spots, cancelled_at from events where id = $1 for update', [eventId])).rows[0];
    if (!e) throw new DomainError('NOT_FOUND');
    if (e.host_id === user.id) throw new DomainError('CONFLICT', 'you are hosting this');
    if (e.cancelled_at || e.ends_at <= now) throw new DomainError('EVENT_CLOSED');
    if ((await tx.query('select 1 from event_participants where event_id = $1 and user_id = $2', [eventId, user.id])).rows.length) return 'already';
    const taken = (await tx.query<{ n: number }>('select count(*)::int as n from event_participants where event_id = $1', [eventId])).rows[0]!.n;
    if (taken >= e.spots) throw new DomainError('EVENT_FULL');
    await tx.query('insert into event_participants (event_id, user_id, joined_at) values ($1, $2, $3)', [eventId, user.id, now]);
    return 'joined';
  });
}

export async function leaveEvent(db: Queryable, user: User, eventId: string): Promise<void> {
  await db.query('delete from event_participants where event_id = $1 and user_id = $2', [eventId, user.id]);
}

/** Only the host can cancel; participants see it as cancelled and it disappears from upcoming lists. */
export async function cancelEvent(db: Queryable, user: User, eventId: string, now: Date): Promise<void> {
  const e = (await db.query<{ host_id: string; cancelled_at: Date | null }>('select host_id, cancelled_at from events where id = $1', [eventId])).rows[0];
  if (!e) throw new DomainError('NOT_FOUND');
  if (e.host_id !== user.id) throw new DomainError('FORBIDDEN');
  if (!e.cancelled_at) await db.query('update events set cancelled_at = $2 where id = $1', [eventId, now]);
}

/** A person's own events for their profile: upcoming joined, past joined, and what they host. */
export async function eventsForProfile(db: Queryable, viewerId: string, userId: string, now: Date): Promise<{ joined: EventSummary[]; past: EventSummary[]; hosting: EventSummary[] }> {
  const [joined, hosting] = await Promise.all([
    db.query<EventRow>(`${SELECT} where e.cancelled_at is null and exists (select 1 from event_participants p where p.event_id = e.id and p.user_id = $2) order by e.starts_at`, [viewerId, userId]),
    db.query<EventRow>(`${SELECT} where e.cancelled_at is null and e.host_id = $2 and e.ends_at > $3 order by e.starts_at`, [viewerId, userId, now]),
  ]);
  const all = joined.rows.map(toEvent);
  return { joined: all.filter((e) => e.endsAt > now), past: all.filter((e) => e.endsAt <= now).reverse(), hosting: hosting.rows.map(toEvent) };
}

export async function listPlaces(db: Queryable): Promise<{ id: string; name: string; area: string }[]> {
  return (await db.query<{ id: string; name: string; area: string }>('select id, name, area from places order by sort_order, name')).rows;
}

export interface MonthlyTheme { month: string; title: string; summary: string; }
export async function monthlyTheme(db: Queryable, now: Date, timeZone: string): Promise<MonthlyTheme | null> {
  return (await db.query<MonthlyTheme>('select month, title, summary from monthly_themes where month = $1', [monthKey(now, timeZone)])).rows[0] ?? null;
}
