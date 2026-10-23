import Link from 'next/link';
import { requireUser } from '@/lib/context';
import { getOwnAddress } from '@/lib/domain/users';
import { AREAS } from '@/lib/domain/types';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { PhotoInput } from '@/components/photo-input';
import { saveProfileAction } from '@/app/actions/social';

export const metadata = { title: 'Edit profile' };

export default async function EditProfile() {
  const { db, user } = await requireUser('/profile/edit');
  const address = await getOwnAddress(db, user.id);
  return (
    <div className="narrow grid gap-6">
      <Link href="/profile" className="small font-bold text-primary">← My profile</Link>
      <div className="page-head"><p className="eyebrow">Edit profile</p><h1>How neighbours see you</h1></div>
      <MutationForm action={saveProfileAction} success="Profile saved." className="card card-pad stack">
        <PhotoInput name="photo" label="Profile photo" shape="round" initialUrl={user.avatarPhotoId ? `/api/photos/${user.avatarPhotoId}` : null} />
        {user.avatarPhotoId && <label className="check"><input type="checkbox" name="removePhoto" /><span>Remove my current photo</span></label>}
        <label className="field">Name<input className="input" name="name" defaultValue={user.name} maxLength={60} required /></label>
        <label className="field">Bio<textarea className="input" name="bio" defaultValue={user.bio} maxLength={300} /></label>
        <label className="field">Area in City of Elmina<select className="input" name="area" defaultValue={user.area}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="field">House address<input className="input" name="houseAddress" defaultValue={address} minLength={5} maxLength={200} required autoComplete="street-address" /><span className="field-hint">Private. Never shown to anyone.</span></label>
        <SubmitButton className="btn-lg">Save changes</SubmitButton>
      </MutationForm>
    </div>
  );
}
