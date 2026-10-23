import Link from 'next/link';
import { requireUser } from '@/lib/context';
import { listPlaces, monthlyTheme } from '@/lib/domain/events';
import { dayKey } from '@/lib/time';
import { EventForm } from '@/components/event-form';

export const metadata = { title: 'Host a workshop' };

export default async function HostWorkshop() {
  const { db, user, now, timeZone } = await requireUser('/workshops/new');
  if (user.role !== 'organiser') {
    return <div className="narrow empty grid gap-3"><h1 className="text-xl">Workshops are hosted by organisers</h1><p>Teachers and climate educators run workshops. You can still host any activity for your neighbours.</p><Link href="/activities/new" className="btn btn-primary justify-self-center">Host an activity</Link></div>;
  }
  const [places, theme] = await Promise.all([listPlaces(db), monthlyTheme(db, now, timeZone)]);
  return (
    <div className="narrow grid gap-6">
      <div className="page-head"><p className="eyebrow">Host a workshop</p><h1>Teach your neighbours something</h1><p className="muted">Climate topics, yoga or wellness. Residents can join straight away.</p></div>
      <EventForm type="workshop" places={places} defaultDate={dayKey(new Date(now.getTime() + 3 * 86_400_000), timeZone)} monthTheme={theme?.title} />
    </div>
  );
}
