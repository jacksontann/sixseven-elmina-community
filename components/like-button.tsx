'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { setLikeAction } from '@/app/actions/social';

/** Heart that responds instantly; the server action is idempotent, so a double tap is harmless. */
export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [state, setState] = useOptimistic({ liked, count });
  const [, startTransition] = useTransition();
  return (
    <button type="button" className={`icon-btn ${state.liked ? 'liked' : ''}`} aria-pressed={state.liked} aria-label={state.liked ? 'Unlike' : 'Like'}
      onClick={() => startTransition(async () => {
        const next = !state.liked;
        setState({ liked: next, count: state.count + (next ? 1 : -1) });
        await setLikeAction(postId, next);
      })}>
      <Heart size={24} aria-hidden fill={state.liked ? 'currentColor' : 'none'} />
      <span>{state.count}</span>
    </button>
  );
}
