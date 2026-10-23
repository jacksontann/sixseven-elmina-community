import Link from 'next/link';
import { requireUser } from '@/lib/context';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { PhotoInput } from '@/components/photo-input';
import { saveProfileAction } from '@/app/actions/social';

export const metadata = { title: 'Set up your profile' };

/** Step 2 of sign-up: a photo and a few words, both optional. */
export default async function SetUpProfile() {
  const { user } = await requireUser('/welcome');
  return (
    <div className="narrow grid gap-6">
      <div className="page-head"><p className="eyebrow">Welcome, {user.name.split(' ')[0]}!</p><h1>Set up your profile</h1><p className="muted">Help your neighbours recognise you. You can change this any time.</p></div>
      <MutationForm action={saveProfileAction} className="card card-pad stack">
        <input type="hidden" name="then" value="home" />
        <PhotoInput name="photo" label="Profile photo" shape="round" />
        <label className="field">A little about you<textarea className="input" name="bio" maxLength={300} placeholder="e.g. New to Elmina Valley, love morning walks and board games." /></label>
        <div className="grid gap-2 sm:grid-cols-2">
          <SubmitButton className="btn-lg">Save and continue</SubmitButton>
          <Link href="/" className="btn btn-secondary btn-lg">Skip for now</Link>
        </div>
      </MutationForm>
    </div>
  );
}
