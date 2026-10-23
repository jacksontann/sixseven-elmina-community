import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/context';
import { listPosts } from '@/lib/domain/posts';
import { PostCard } from '@/components/post-card';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { deletePostAction } from '@/app/actions/social';

export const metadata = { title: 'Post' };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user, now, fmt } = await requireUser(`/post/${id}`);
  const post = (await listPosts(db, user.id, { postId: id }))[0];
  if (!post) notFound();
  return (
    <div className="narrow grid gap-4">
      <Link href="/" className="small font-bold text-primary">← Back to feed</Link>
      <PostCard post={post} now={now} fmt={fmt} showAllComments />
      {post.author.id === user.id && <MutationForm action={deletePostAction} className="row"><input type="hidden" name="postId" value={post.id} /><SubmitButton variant="secondary">Delete this post</SubmitButton></MutationForm>}
    </div>
  );
}
