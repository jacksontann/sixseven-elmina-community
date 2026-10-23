import type { Queryable } from '@/lib/db/types';
import { monthKey, monthStart, nextMonthKey } from '@/lib/time';
import { DomainError } from './errors';
import { MATERIALS, type Material, type User } from './types';

/** The small recycling tracker on each resident's profile. Self-reported and private to its owner. */
export async function logRecycling(db: Queryable, user: User, input: { material: string; kg: number }, now: Date): Promise<void> {
  if (!MATERIALS.includes(input.material as Material) || !Number.isFinite(input.kg) || input.kg <= 0 || input.kg > 100) throw new DomainError('VALIDATION_ERROR');
  await db.query('insert into recycling_logs (user_id, material, kg, logged_at) values ($1, $2, $3, $4)', [user.id, input.material, Math.round(input.kg * 100) / 100, now]);
}

export async function deleteRecycling(db: Queryable, user: User, id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new DomainError('NOT_FOUND');
  await db.query('delete from recycling_logs where id = $1 and user_id = $2', [id, user.id]);
}

export interface RecyclingSummary {
  monthKg: number;
  lastMonthKg: number;
  totalKg: number;
  byMaterial: { material: Material; kg: number }[];
  recent: { id: string; material: Material; kg: number; loggedAt: Date }[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function recyclingSummary(db: Queryable, userId: string, now: Date, timeZone: string): Promise<RecyclingSummary> {
  const thisMonth = monthKey(now, timeZone);
  const from = monthStart(thisMonth, timeZone), to = monthStart(nextMonthKey(thisMonth), timeZone);
  const lastFrom = new Date(from.getTime() - 1); const lastKey = monthKey(lastFrom, timeZone);
  const [totals, materials, recent] = await Promise.all([
    db.query<{ month: string; last: string; total: string }>(
      `select coalesce(sum(kg) filter (where logged_at >= $2 and logged_at < $3), 0) as month,
              coalesce(sum(kg) filter (where logged_at >= $4 and logged_at < $2), 0) as last,
              coalesce(sum(kg), 0) as total from recycling_logs where user_id = $1`,
      [userId, from, to, monthStart(lastKey, timeZone)],
    ),
    db.query<{ material: Material; kg: string }>('select material, sum(kg) as kg from recycling_logs where user_id = $1 and logged_at >= $2 and logged_at < $3 group by material order by sum(kg) desc', [userId, from, to]),
    db.query<{ id: string; material: Material; kg: string; logged_at: Date }>('select id, material, kg, logged_at from recycling_logs where user_id = $1 order by logged_at desc limit 10', [userId]),
  ]);
  const t = totals.rows[0]!;
  return {
    monthKg: round1(Number(t.month)), lastMonthKg: round1(Number(t.last)), totalKg: round1(Number(t.total)),
    byMaterial: materials.rows.map((r) => ({ material: r.material, kg: round1(Number(r.kg)) })),
    recent: recent.rows.map((r) => ({ id: r.id, material: r.material, kg: Number(r.kg), loggedAt: r.logged_at })),
  };
}
