'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="narrow empty mt-10 grid gap-4">
      <h1 className="text-xl">Something went wrong</h1>
      <p>Please try again. If it keeps happening, refresh the page.</p>
      <button type="button" className="btn btn-primary justify-self-center" onClick={reset}>Try again</button>
    </div>
  );
}
