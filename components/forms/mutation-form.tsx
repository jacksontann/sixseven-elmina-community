'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from 'react';
import type { ActionResult } from '@/lib/actions';
import { ERROR_MESSAGES } from '@/lib/domain/errors';
import { cn } from '@/lib/utils';

export type Mutation = (previous: ActionResult<unknown> | null, data: FormData) => Promise<ActionResult<unknown>>;
const Pending = createContext(false);

/**
 * Form for a server action. Input is kept when something fails, and the result is announced politely to
 * screen readers. On success the form can reset itself (e.g. a comment box).
 */
export function MutationForm({ action, success, children, className = 'stack', resetOnSuccess = false }: { action: Mutation; success?: string; children: React.ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [result, dispatch, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (result?.ok && resetOnSuccess) form.current?.reset(); }, [result, resetOnSuccess]);
  return (
    <form ref={form} className={className} onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
      startTransition(() => dispatch(data));
    }}>
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      <div aria-live="polite" className="empty:hidden">{!pending && result && (result.ok ? (success ? <p role="status" className="notice">{success}</p> : null) : <p role="status" className="notice notice-error">{ERROR_MESSAGES[result.code]}</p>)}</div>
    </form>
  );
}

export function SubmitButton({ children, className, name, value, variant = 'primary' }: { children: React.ReactNode; className?: string; name?: string; value?: string; variant?: 'primary' | 'secondary' | 'climate' | 'ghost' }) {
  const pending = useContext(Pending);
  return <button type="submit" disabled={pending} name={name} value={value} className={cn('btn', `btn-${variant}`, className)}>{children}</button>;
}
