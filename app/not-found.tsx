import Link from 'next/link';
import { getContext } from '@/lib/context';

export default async function NotFound() {
  const Wrapper = (await getContext()).user ? 'div' : 'main';
  return (
    <Wrapper className="narrow empty mt-10 grid gap-4">
      <h1 className="text-xl">We couldn’t find that page</h1>
      <p>It may have been removed, or the link is wrong.</p>
      <Link href="/" className="btn btn-primary justify-self-center">Go home</Link>
    </Wrapper>
  );
}
