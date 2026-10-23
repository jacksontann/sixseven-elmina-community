import Image from 'next/image';
import Link from 'next/link';
import { Leaf, MapPin, Pencil } from 'lucide-react';
import type { EventSummary } from '@/lib/domain/events';
import type { Post } from '@/lib/domain/posts';
import type { PublicProfile } from '@/lib/domain/types';
import type { Formatter } from '@/lib/format';
import { Avatar } from '@/components/avatar';
import { EventCard } from '@/components/event-card';

export type ProfileTab = 'posts' | 'joined' | 'hosting';

/** A resident's profile: who they are, their photo grid, and the activities and workshops they join or host. */
export function ProfileView({ profile, posts, events, stats, tab, basePath, isOwn, now, fmt, aside }: {
  profile: PublicProfile; posts: Post[]; events: { joined: EventSummary[]; past: EventSummary[]; hosting: EventSummary[] }; stats: { posts: number; joined: number; hosting: number };
  tab: ProfileTab; basePath: string; isOwn: boolean; now: Date; fmt: Formatter; aside?: React.ReactNode;
}) {
  const tabs: [ProfileTab, string][] = [['posts', 'Posts'], ['joined', isOwn ? 'Joined' : 'Going to'], ['hosting', 'Hosting']];
  const list = tab === 'joined' ? [...events.joined, ...events.past] : events.hosting;
  return (
    <div className={aside ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]' : ''}>
      <div className="min-w-0">
        <header className="profile-head">
          <Avatar person={profile} size={96} />
          <div className="grid gap-2 min-w-0">
            <div className="row"><h1 className="text-2xl">{profile.name}</h1>{profile.isSample && <span className="badge">Sample resident</span>}</div>
            {profile.role === 'organiser' && <span className="badge badge-climate self-start"><Leaf size={12} aria-hidden />{profile.organiserTitle ?? 'Organiser'}</span>}
            <p className="row small muted"><MapPin size={15} aria-hidden />{profile.area}, City of Elmina</p>
            <div className="stats small">
              <span><strong>{stats.posts}</strong>posts</span>
              <span><strong>{stats.joined}</strong>joined</span>
              <span><strong>{stats.hosting}</strong>hosting</span>
            </div>
          </div>
        </header>
        {profile.bio && <p className="mt-4 whitespace-pre-line">{profile.bio}</p>}
        {isOwn && <Link href="/profile/edit" className="btn btn-secondary mt-4"><Pencil size={16} aria-hidden />Edit profile</Link>}
        <nav className="tabs" aria-label="Profile sections">{tabs.map(([key, label]) => <Link key={key} href={key === 'posts' ? basePath : `${basePath}?tab=${key}`} className="tab" aria-current={tab === key ? 'page' : undefined}>{label}</Link>)}</nav>
        {tab === 'posts' ? (posts.length ? (
          <div className="photo-grid">{posts.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} aria-label={p.caption ? `Post: ${p.caption.slice(0, 80)}` : 'Photo post'}>
              {p.photoId ? <img src={`/api/photos/${p.photoId}`} alt="" className="h-full w-full object-cover" loading="lazy" /> : p.staticPhoto ? <Image src={p.staticPhoto} alt="" fill sizes="(min-width: 1024px) 220px, 33vw" className="object-cover" /> : <span className="text-tile h-full">{p.caption.slice(0, 90)}</span>}
            </Link>
          ))}</div>
        ) : <p className="empty">{isOwn ? 'You haven’t posted yet. Share your first photo!' : 'No posts yet.'}</p>)
          : list.length ? <div className="grid-cards">{list.map((e) => <EventCard key={e.id} event={e} now={now} fmt={fmt} />)}</div>
          : <p className="empty">{tab === 'joined' ? (isOwn ? 'Join an activity or workshop and it will show here.' : 'Nothing yet.') : (isOwn ? 'Host an activity and it will show here.' : 'Not hosting anything right now.')}</p>}
      </div>
      {aside && <aside className="grid gap-4 self-start lg:sticky lg:top-8">{aside}</aside>}
    </div>
  );
}
