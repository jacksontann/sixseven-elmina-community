import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getContext } from '@/lib/context';
import { AREAS } from '@/lib/domain/types';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { Logo } from '@/components/shell/app-shell';
import { signUpAction } from '@/app/actions/auth';

export const metadata = { title: 'Sign up' };

export default async function SignUp() {
  if ((await getContext()).user) redirect('/');
  return (
    <main id="main" className="min-h-dvh px-4 py-8">
      <div className="auth-card grid gap-6">
        <Logo />
        <div className="grid gap-2"><h1>Join your neighbours</h1><p className="muted">Create your Elmina account. It takes about a minute.</p></div>
        <MutationForm action={signUpAction} className="card card-pad stack">
          <label className="field">Your name<input className="input" name="name" autoComplete="name" maxLength={60} required /></label>
          <label className="field">Email<input className="input" type="email" name="email" autoComplete="email" maxLength={254} required /></label>
          <label className="field">Password<input className="input" type="password" name="password" autoComplete="new-password" minLength={8} maxLength={200} required /><span className="field-hint">At least 8 characters.</span></label>
          <fieldset className="grid gap-3 rounded-xl bg-surface-2 p-3">
            <legend className="sr-only">Where you live</legend>
            <label className="field">House address<input className="input" name="houseAddress" autoComplete="street-address" placeholder="e.g. 12 Jalan Ficus U15/2" minLength={5} maxLength={200} required /><span className="field-hint">Private. Never shown to other residents.</span></label>
            <label className="field">Area in City of Elmina<select className="input" name="area" required defaultValue=""><option value="" disabled>Choose your area</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select><span className="field-hint">Shown on your profile so neighbours know you’re nearby.</span></label>
          </fieldset>
          <label className="check"><input type="checkbox" name="terms" required /><span>I understand this is a hackathon prototype with sample data, and I won’t share anyone’s private details.</span></label>
          <SubmitButton className="btn-lg">Create account</SubmitButton>
        </MutationForm>
        <p className="text-center">Already have an account? <Link className="font-bold text-primary" href="/login">Log in</Link></p>
      </div>
    </main>
  );
}
