import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/context';
import { getEvent, participants } from '@/lib/domain/events';
import { EventDetail } from '@/components/event-detail';

export const metadata = { title: 'Activity' };

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user, now, fmt } = await requireUser(`/activities/${id}`);
  const event = await getEvent(db, user.id, id);
  if (!event || event.type !== 'activity') notFound();
  return <EventDetail event={event} going={await participants(db, event.id)} user={user} now={now} fmt={fmt} />;
}
