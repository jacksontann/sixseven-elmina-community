import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { requireUser } from '@/lib/context';
import { listEvents } from '@/lib/domain/events';
import { ACTIVITY_CATEGORIES } from '@/lib/domain/types';
import { EventCard } from '@/components/event-card';

export const metadata = { title: 'Activities' };

export default async function Activities({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { db, user, now, fmt } = await requireUser('/activities');
  const query = await searchParams;
  const category = ACTIVITY_CATEGORIES.find((c) => c === query.category);
  const q = (query.q ?? '').slice(0, 80);
  const events = await listEvents(db, user.id, now, { type: 'activity', category, q });
  const link = (c?: string) => `/activities?${new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { category: c } : {}) })}`;
  return (
    <div className="grid gap-5">
      <div className="between">
        <div className="page-head mb-0"><p className="eyebrow">Activities</p><h1>Do something with your neighbours</h1><p className="muted">Hosted by residents, at real places around City of Elmina.</p></div>
        <Link href="/activities/new" className="btn btn-primary"><Plus size={18} aria-hidden />Host an activity</Link>
      </div>
      <form action="/activities" className="row" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <label className="sr-only" htmlFor="activity-search">Search activities</label>
        <input id="activity-search" name="q" defaultValue={q} className="input flex-1" placeholder="Search walks, futsal, Sakura Lake…" maxLength={80} />
        <button type="submit" className="btn btn-secondary" aria-label="Search"><Search size={18} aria-hidden /></button>
      </form>
      <nav aria-label="Categories" className="chip-row">
        <Link href={link()} className="chip" aria-current={!category ? 'true' : undefined}>All</Link>
        {ACTIVITY_CATEGORIES.map((c) => <Link key={c} href={link(c)} className="chip" aria-current={category === c ? 'true' : undefined}>{c}</Link>)}
      </nav>
      <p className="small muted" aria-live="polite">{events.length} upcoming {events.length === 1 ? 'activity' : 'activities'}{q ? ` matching “${q}”` : ''}</p>
      {events.length ? <div className="grid-cards">{events.map((e) => <EventCard key={e.id} event={e} now={now} fmt={fmt} />)}</div> : <div className="empty grid gap-3"><p>No activities match. Why not start one?</p><Link href="/activities/new" className="btn btn-primary justify-self-center">Host an activity</Link></div>}
    </div>
  );
}
