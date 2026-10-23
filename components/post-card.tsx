import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MessageCircle } from 'lucide-react';
import type { Post } from '@/lib/domain/posts';
import type { Formatter } from '@/lib/format';
import { Avatar } from '@/components/avatar';
import { LikeButton } from '@/components/like-button';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { commentAction } from '@/app/actions/social';

/** One post in the feed: author, photo, likes, caption, tagged activity and the latest comments. */
export function PostCard({ post, now, fmt, showAllComments = false }: { post: Post; now: Date; fmt: Formatter; showAllComments?: boolean }) {
  const comments = showAllComments ? post.comments : post.comments.slice(-2);
  const photo = post.photoId ? `/api/photos/${post.photoId}` : post.staticPhoto;
  return (
    <article className="card post" aria-label={`Post by ${post.author.name}`}>
      <header className="post-head">
        <Avatar person={post.author} size={42} link />
        <div className="min-w-0">
          <Link href={`/u/${post.author.id}`} className="font-bold hover:underline">{post.author.name}</Link>
          <p className="small muted">{post.author.role === 'organiser' && post.author.organiserTitle ? `${post.author.organiserTitle} · ` : ''}{post.author.area} · {fmt.ago(post.createdAt, now)}</p>
        </div>
      </header>
      {photo && <div className="media media-square">{post.photoId ? <img src={photo} alt={post.caption ? `Photo: ${post.caption.slice(0, 120)}` : `Photo shared by ${post.author.name}`} loading="lazy" /> : <Image src={photo} alt={post.caption ? `Photo: ${post.caption.slice(0, 120)}` : `Photo shared by ${post.author.name}`} fill sizes="(min-width: 1100px) 600px, 100vw" className="object-cover" />}</div>}
      <div className="post-body">
        <div className="post-actions">
          <LikeButton postId={post.id} liked={post.viewerLiked} count={post.likes} />
          <Link className="icon-btn" href={`/post/${post.id}`} aria-label={`Comments (${post.commentCount})`}><MessageCircle size={24} aria-hidden /><span>{post.commentCount}</span></Link>
        </div>
        {post.caption && <p><Link href={`/u/${post.author.id}`} className="font-bold">{post.author.name.split(' ')[0]}</Link> {post.caption}</p>}
        {post.event && <Link className="tag-link" href={`/${post.event.type === 'workshop' ? 'workshops' : 'activities'}/${post.event.id}`}><CalendarDays size={16} aria-hidden />{post.event.title} →</Link>}
        {post.commentCount > comments.length && <Link href={`/post/${post.id}`} className="small muted">View all {post.commentCount} comments</Link>}
        {comments.map((c) => <p key={c.id} className="comment"><Link href={`/u/${c.author.id}`} className="font-bold">{c.author.name.split(' ')[0]}</Link> {c.body}</p>)}
        <MutationForm action={commentAction} resetOnSuccess className="flex items-center gap-2">
          <input type="hidden" name="postId" value={post.id} />
          <label className="sr-only" htmlFor={`comment-${post.id}`}>Add a comment</label>
          <input id={`comment-${post.id}`} name="body" className="input" placeholder="Add a comment…" maxLength={300} required autoComplete="off" />
          <SubmitButton variant="ghost">Post</SubmitButton>
        </MutationForm>
      </div>
    </article>
  );
}
