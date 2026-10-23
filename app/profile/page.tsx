import { requireUser } from '@/lib/context';
import { eventsForProfile } from '@/lib/domain/events';
import { listPosts } from '@/lib/domain/posts';
import { recyclingSummary } from '@/lib/domain/recycling';
import { profileStats, toPublic } from '@/lib/domain/users';
import { ProfileView, type ProfileTab } from '@/components/profile-view';
import { RecyclingTracker } from '@/components/recycling-tracker';

export const metadata = { title: 'My profile' };

export default async function MyProfile({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { db, user, now, fmt, timeZone } = await requireUser('/profile');
  const requested = (await searchParams).tab;
  const tab: ProfileTab = requested === 'joined' || requested === 'hosting' ? requested : 'posts';
  const [posts, events, stats, recycling] = await Promise.all([listPosts(db, user.id, { authorId: user.id, limit: 60 }), eventsForProfile(db, user.id, user.id, now), profileStats(db, user.id, now), recyclingSummary(db, user.id, now, timeZone)]);
  return <ProfileView profile={toPublic(user)} posts={posts} events={events} stats={stats} tab={tab} basePath="/profile" isOwn now={now} fmt={fmt} aside={<RecyclingTracker summary={recycling} now={now} fmt={fmt} />} />;
}
