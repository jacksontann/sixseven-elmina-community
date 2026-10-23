import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/context';
import { eventsForProfile } from '@/lib/domain/events';
import { listPosts } from '@/lib/domain/posts';
import { getProfile, profileStats } from '@/lib/domain/users';
import { ProfileView, type ProfileTab } from '@/components/profile-view';

export const metadata = { title: 'Resident profile' };

/** Another resident's profile. Their recycling tracker and house address are private and never shown. */
export default async function ResidentProfile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { db, user, now, fmt } = await requireUser(`/u/${id}`);
  if (id === user.id) redirect('/profile');
  const profile = await getProfile(db, id);
  if (!profile) notFound();
  const requested = (await searchParams).tab;
  const tab: ProfileTab = requested === 'joined' || requested === 'hosting' ? requested : 'posts';
  const [posts, events, stats] = await Promise.all([listPosts(db, user.id, { authorId: id, limit: 60 }), eventsForProfile(db, user.id, id, now), profileStats(db, id, now)]);
  return <ProfileView profile={profile} posts={posts} events={events} stats={stats} tab={tab} basePath={`/u/${id}`} isOwn={false} now={now} fmt={fmt} />;
}
