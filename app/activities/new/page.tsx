import { requireUser } from '@/lib/context';
import { listPlaces } from '@/lib/domain/events';
import { dayKey } from '@/lib/time';
import { EventForm } from '@/components/event-form';

export const metadata = { title: 'Host an activity' };

export default async function HostActivity() {
  const { db, now, timeZone } = await requireUser('/activities/new');
  return (
    <div className="narrow grid gap-6">
      <div className="page-head"><p className="eyebrow">Host an activity</p><h1>Start something with your neighbours</h1><p className="muted">A walk, a game, a clean-up: anything at a public place in Elmina. It’s free and goes live straight away.</p></div>
      <EventForm type="activity" places={await listPlaces(db)} defaultDate={dayKey(new Date(now.getTime() + 86_400_000), timeZone)} />
    </div>
  );
}
