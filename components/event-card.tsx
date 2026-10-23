import Image from 'next/image';
import Link from 'next/link';
import { Clock3, Leaf, MapPin } from 'lucide-react';
import { spotsLeft, type EventSummary } from '@/lib/domain/events';
import type { Formatter } from '@/lib/format';
import { Avatar } from '@/components/avatar';
import { Scene, sceneFor } from '@/components/art/scene';

/** Shared card for activities and workshops: same 16:9 image shape whatever the photo's size. */
export function EventCard({ event: e, now, fmt }: { event: EventSummary; now: Date; fmt: Formatter }) {
  const href = `/${e.type === 'workshop' ? 'workshops' : 'activities'}/${e.id}`;
  const left = spotsLeft(e);
  return (
    <article className="card event-card">
      <Link href={href} className="media media-video block" tabIndex={-1} aria-hidden>
        {e.coverPhotoId ? <img src={`/api/photos/${e.coverPhotoId}`} alt="" loading="lazy" /> : e.coverImage ? <Image src={e.coverImage} alt="" fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <Scene category={sceneFor(e.category)} />}
        <span className="date-badge">{fmt.relativeDay(e.startsAt, now)}</span>
        {e.isMonthlyClimate && <span className="type-badge badge badge-climate"><Leaf size={12} aria-hidden />This month’s theme</span>}
      </Link>
      <div className="event-card-body">
        <span className="badge self-start">{e.category}</span>
        <h3><Link href={href} className="hover:underline">{e.title}</Link></h3>
        <p className="event-meta"><Clock3 size={15} aria-hidden />{fmt.time(e.startsAt)} – {fmt.time(e.endsAt)}</p>
        <p className="event-meta"><MapPin size={15} aria-hidden />{e.placeName}</p>
        <div className="between mt-1">
          <span className="row small"><Avatar person={e.host} size={26} />{e.host.name}</span>
          <span className={`spots ${left === 0 ? 'full' : ''}`}>{e.viewerJoined ? 'You’re going ✓' : left === 0 ? 'Full' : `${left} spot${left === 1 ? '' : 's'} left`}</span>
        </div>
      </div>
    </article>
  );
}
