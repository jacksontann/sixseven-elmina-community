import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock3, ImagePlus, Leaf, MapPin, UsersRound } from 'lucide-react';
import { spotsLeft, type EventSummary } from '@/lib/domain/events';
import type { PublicProfile, User } from '@/lib/domain/types';
import type { Formatter } from '@/lib/format';
import { Avatar } from '@/components/avatar';
import { Scene, sceneFor } from '@/components/art/scene';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { cancelEventAction, joinEventAction } from '@/app/actions/social';

/** Activity and workshop page: photo, when and where, who's hosting, who's going, and one-tap join. */
export function EventDetail({ event: e, going, user, now, fmt }: { event: EventSummary; going: Pick<PublicProfile, 'id' | 'name' | 'avatarPhotoId'>[]; user: User; now: Date; fmt: Formatter }) {
  const list = e.type === 'workshop' ? '/workshops' : '/activities';
  const left = spotsLeft(e);
  const ended = e.endsAt <= now;
  const isHost = e.host.id === user.id;
  return (
    <div className="grid gap-6">
      <Link href={list} className="small font-bold text-primary">← All {e.type === 'workshop' ? 'workshops' : 'activities'}</Link>
      <div className="media media-video rounded-[20px]">
        {e.coverPhotoId ? <img src={`/api/photos/${e.coverPhotoId}`} alt={`Cover photo for ${e.title}`} /> : e.coverImage ? <Image src={e.coverImage} alt={`${e.placeName}, City of Elmina`} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" /> : <Scene category={sceneFor(e.category)} hero />}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5 self-start">
          <div className="grid gap-2">
            <div className="row"><span className="badge">{e.type === 'workshop' ? 'Workshop' : 'Activity'} · {e.category}</span>{e.isMonthlyClimate && <span className="badge badge-climate"><Leaf size={12} aria-hidden />This month’s climate theme</span>}</div>
            <h1>{e.title}</h1>
          </div>
          <Link href={`/u/${e.host.id}`} className="card card-pad row hover:bg-surface-2">
            <Avatar person={e.host} size={48} />
            <span><span className="small muted block">Hosted by</span><strong>{e.host.name}</strong>{e.host.organiserTitle && <span className="small muted block">{e.host.organiserTitle}</span>}</span>
          </Link>
          {e.description && <section className="grid gap-2"><h2>About</h2><p className="whitespace-pre-line">{e.description}</p></section>}
          <section className="grid gap-3" aria-labelledby="going-title">
            <h2 id="going-title" className="row"><UsersRound size={20} aria-hidden />Who’s going ({e.taken})</h2>
            {going.length ? <ul className="flex flex-wrap gap-3">{going.map((p) => <li key={p.id}><Link href={`/u/${p.id}`} className="row rounded-full bg-surface pr-3 border border-border"><Avatar person={p} size={34} /><span className="small font-semibold">{p.name.split(' ')[0]}</span></Link></li>)}</ul> : <p className="muted">Nobody yet. Be the first!</p>}
          </section>
        </div>
        <aside className="card card-pad grid gap-4 self-start lg:sticky lg:top-8">
          <p className="row font-semibold"><CalendarDays size={18} className="text-primary" aria-hidden />{fmt.longDay(e.startsAt)}</p>
          <p className="row"><Clock3 size={18} className="text-primary" aria-hidden />{fmt.time(e.startsAt)} – {fmt.time(e.endsAt)} (Malaysia time)</p>
          <p className="row"><MapPin size={18} className="text-primary" aria-hidden /><span>{e.placeName}<span className="small muted block">{e.placeArea}, City of Elmina</span></span></p>
          <p className="spots">{e.taken} going · {left === 0 ? 'Full' : `${left} of ${e.spots} spots left`}</p>
          {e.cancelled ? <p className="notice notice-error">This {e.type} was cancelled by the host.</p>
            : ended ? <p className="notice">This {e.type} has ended.</p>
            : isHost ? <>
                <p className="notice">You’re hosting this {e.type}.</p>
                <details><summary className="small font-semibold">Cancel this {e.type}</summary>
                  <MutationForm action={cancelEventAction} className="mt-2"><input type="hidden" name="eventId" value={e.id} /><SubmitButton variant="secondary" className="btn-block">Yes, cancel it</SubmitButton></MutationForm>
                </details>
              </>
            : e.viewerJoined ? <>
                <p className="notice">You’re going! See you there.</p>
                <MutationForm action={joinEventAction}><input type="hidden" name="eventId" value={e.id} /><input type="hidden" name="leave" value="yes" /><SubmitButton variant="secondary" className="btn-block">Can’t make it? Leave</SubmitButton></MutationForm>
              </>
            : <MutationForm action={joinEventAction}><input type="hidden" name="eventId" value={e.id} />{left === 0 ? <button type="button" className="btn btn-secondary btn-block" disabled>Full</button> : <SubmitButton className="btn-block btn-lg">{e.type === 'workshop' ? 'Join workshop' : 'Join activity'}</SubmitButton>}</MutationForm>}
          <Link href={`/post/new?event=${e.id}`} className="btn btn-ghost"><ImagePlus size={18} aria-hidden />Share a photo from this</Link>
        </aside>
      </div>
    </div>
  );
}
