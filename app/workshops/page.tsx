import Link from 'next/link';
import { Leaf, Plus } from 'lucide-react';
import { requireUser } from '@/lib/context';
import { listEvents, monthlyTheme } from '@/lib/domain/events';
import { WORKSHOP_TOPICS } from '@/lib/domain/types';
import { EventCard } from '@/components/event-card';

export const metadata = { title: 'Workshops' };

/** Monthly workshops by organisers and teachers: this month's climate theme first, then yoga and wellness. */
export default async function Workshops({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { db, user, now, fmt, timeZone } = await requireUser('/workshops');
  const requested = (await searchParams).topic;
  const topic = WORKSHOP_TOPICS.find((t) => t === requested);
  const [theme, climate, all] = await Promise.all([
    monthlyTheme(db, now, timeZone),
    listEvents(db, user.id, now, { type: 'workshop', monthlyClimate: true }),
    listEvents(db, user.id, now, { type: 'workshop', category: topic }),
  ]);
  return (
    <div className="grid gap-6">
      <div className="between">
        <div className="page-head mb-0"><p className="eyebrow">Workshops</p><h1>Learn something new together</h1><p className="muted">Every month: a climate topic, plus yoga and wellness with local teachers.</p></div>
        {user.role === 'organiser' && <Link href="/workshops/new" className="btn btn-primary"><Plus size={18} aria-hidden />Host a workshop</Link>}
      </div>
      {theme && (
        <section className="theme-banner grid gap-3" aria-labelledby="theme-title">
          <span className="badge self-start"><Leaf size={13} aria-hidden />{fmt.month(now)} · this month’s climate theme</span>
          <h2 id="theme-title" className="text-2xl text-white">{theme.title}</h2>
          <p className="max-w-2xl">{theme.summary}</p>
          <p className="small">Learn it here, then do something about it: track your recycling on your profile.</p>
        </section>
      )}
      {climate.length > 0 && <section aria-labelledby="climate-title"><div className="section-title"><h2 id="climate-title">This month’s climate workshops</h2></div><div className="grid-cards">{climate.map((e) => <EventCard key={e.id} event={e} now={now} fmt={fmt} />)}</div></section>}
      <section aria-labelledby="all-title">
        <div className="section-title"><h2 id="all-title">All upcoming workshops</h2></div>
        <nav aria-label="Topics" className="chip-row mb-4">
          <Link href="/workshops" className="chip" aria-current={!topic ? 'true' : undefined}>All</Link>
          {WORKSHOP_TOPICS.map((t) => <Link key={t} href={`/workshops?topic=${encodeURIComponent(t)}`} className="chip" aria-current={topic === t ? 'true' : undefined}>{t}</Link>)}
        </nav>
        {all.length ? <div className="grid-cards">{all.map((e) => <EventCard key={e.id} event={e} now={now} fmt={fmt} />)}</div> : <p className="empty">No upcoming {topic?.toLowerCase() ?? ''} workshops yet.</p>}
      </section>
    </div>
  );
}
