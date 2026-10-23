import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getContext } from '@/lib/context';
import { DEMO_PASSWORD } from '@/lib/demo/seed';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { Logo } from '@/components/shell/app-shell';
import { demoLogInAction, logInAction } from '@/app/actions/auth';

export const metadata = { title: 'Log in' };

export default async function LogIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if ((await getContext()).user) redirect('/');
  const next = (await searchParams).next ?? '/';
  return (
    <main id="main" className="min-h-dvh px-4 py-8">
      <div className="auth-card grid gap-6">
        <Logo />
        <div className="grid gap-2"><h1>Welcome back</h1><p className="muted">Log in to see what your neighbours are up to.</p></div>
        <MutationForm action={logInAction} className="card card-pad stack">
          <input type="hidden" name="next" value={next} />
          <label className="field">Email<input className="input" type="email" name="email" autoComplete="email" required /></label>
          <label className="field">Password<input className="input" type="password" name="password" autoComplete="current-password" required /></label>
          <SubmitButton className="btn-lg">Log in</SubmitButton>
        </MutationForm>
        <section className="card card-pad grid gap-3" aria-labelledby="demo-title">
          <h2 id="demo-title" className="text-base">Try a sample account</h2>
          <p className="small muted">Fictional people for the demo. Email <code>aina@example.com</code> or <code>drsiti@example.com</code>, password <code>{DEMO_PASSWORD}</code>.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <form action={demoLogInAction}><input type="hidden" name="account" value="aina" /><input type="hidden" name="next" value={next} /><button className="btn btn-secondary btn-block" type="submit">Aina · resident</button></form>
            <form action={demoLogInAction}><input type="hidden" name="account" value="drsiti" /><input type="hidden" name="next" value={next} /><button className="btn btn-secondary btn-block" type="submit">Dr Siti · organiser</button></form>
          </div>
        </section>
        <p className="text-center">New to Elmina? <Link className="font-bold text-primary" href="/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
