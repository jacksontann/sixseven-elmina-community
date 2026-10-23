import { ACTIVITY_CATEGORIES, WORKSHOP_TOPICS, type EventType } from '@/lib/domain/types';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { PhotoInput } from '@/components/photo-input';
import { createEventAction } from '@/app/actions/social';

/** One short form to host an activity or (for organisers) a workshop. It goes live straight away. */
export function EventForm({ type, places, defaultDate, monthTheme }: { type: EventType; places: { id: string; name: string; area: string }[]; defaultDate: string; monthTheme?: string | null }) {
  const options = type === 'workshop' ? WORKSHOP_TOPICS : ACTIVITY_CATEGORIES;
  return (
    <MutationForm action={createEventAction} className="card card-pad stack">
      <input type="hidden" name="type" value={type} />
      <label className="field">Title<input className="input" name="title" minLength={3} maxLength={90} required placeholder={type === 'workshop' ? 'e.g. Composting at home, the easy way' : 'e.g. Weekend badminton doubles'} /></label>
      <div className="form-grid two">
        <label className="field">{type === 'workshop' ? 'Topic' : 'Category'}<select className="input" name="category" required>{options.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="field">Spots<input className="input" type="number" name="spots" min={2} max={type === 'workshop' ? 200 : 50} defaultValue={type === 'workshop' ? 25 : 10} required /></label>
      </div>
      {type === 'workshop' && <label className="check"><input type="checkbox" name="monthlyClimate" /><span>Part of this month’s climate theme{monthTheme ? `: “${monthTheme}”` : ''} (Climate topic only)</span></label>}
      <label className="field">Where in City of Elmina<select className="input" name="placeId" required defaultValue=""><option value="" disabled>Choose a public place</option>{places.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.area}</option>)}</select><span className="field-hint">Public places only, never a home address.</span></label>
      <div className="form-grid three">
        <label className="field">Date<input className="input" type="date" name="date" defaultValue={defaultDate} required /></label>
        <label className="field">Starts<input className="input" type="time" name="start" defaultValue="18:00" required /></label>
        <label className="field">Ends<input className="input" type="time" name="end" defaultValue="19:00" required /></label>
      </div>
      <label className="field">Description<textarea className="input" name="description" maxLength={1500} placeholder="What will you do? What should people bring?" /></label>
      <PhotoInput name="cover" label="Cover photo (optional)" shape="video" />
      <SubmitButton className="btn-lg">{type === 'workshop' ? 'Publish workshop' : 'Publish activity'}</SubmitButton>
    </MutationForm>
  );
}
