import { requireUser } from '@/lib/context';
import { eventsForProfile, listEvents } from '@/lib/domain/events';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { PhotoInput } from '@/components/photo-input';
import { createPostAction } from '@/app/actions/social';

export const metadata = { title: 'New post' };

export default async function NewPost({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { db, user, now, fmt } = await requireUser('/post/new');
  const preselect = (await searchParams).event ?? '';
  // Things you can tag: what you joined (recent or upcoming), what you host, then other upcoming events.
  const [mine, activities, workshops] = await Promise.all([eventsForProfile(db, user.id, user.id, now), listEvents(db, user.id, now, { type: 'activity', limit: 20 }), listEvents(db, user.id, now, { type: 'workshop', limit: 20 })]);
  const seen = new Set<string>();
  const options = [...mine.past.slice(0, 5), ...mine.joined, ...mine.hosting, ...activities, ...workshops].filter((e) => !seen.has(e.id) && seen.add(e.id));
  return (
    <div className="narrow grid gap-6">
      <div className="page-head"><p className="eyebrow">New post</p><h1>Share with your neighbours</h1></div>
      <MutationForm action={createPostAction} className="card card-pad stack">
        <PhotoInput name="photo" label="Photo (optional)" shape="square" />
        <label className="field">Caption<textarea className="input" name="caption" maxLength={600} placeholder="What’s happening in your corner of Elmina?" /><span className="field-hint">Please don’t post phone numbers, addresses or photos of other people’s children.</span></label>
        <label className="field">Tag an activity or workshop (optional)<select className="input" name="eventId" defaultValue={options.some((e) => e.id === preselect) ? preselect : ''}><option value="">No tag</option>{options.map((e) => <option key={e.id} value={e.id}>{e.title} · {fmt.day(e.startsAt)}</option>)}</select></label>
        <SubmitButton className="btn-lg">Share post</SubmitButton>
      </MutationForm>
    </div>
  );
}
