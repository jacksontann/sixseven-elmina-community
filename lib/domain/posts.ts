import type { Queryable } from '@/lib/db/types';
import { DomainError } from './errors';
import type { PublicProfile, User } from './types';

export interface PostComment { id: string; body: string; createdAt: Date; author: Pick<PublicProfile, 'id' | 'name' | 'avatarPhotoId'>; }
export interface Post {
  id: string;
  caption: string;
  photoId: string | null;
  staticPhoto: string | null;
  createdAt: Date;
  author: Pick<PublicProfile, 'id' | 'name' | 'area' | 'avatarPhotoId' | 'role' | 'organiserTitle'>;
  event: { id: string; type: 'activity' | 'workshop'; title: string } | null;
  likes: number;
  viewerLiked: boolean;
  comments: PostComment[];
  commentCount: number;
}

interface PostRow {
  id: string; caption: string; photo_id: string | null; static_photo: string | null; created_at: Date;
  author_id: string; author_name: string; author_area: PublicProfile['area']; author_avatar: string | null; author_role: 'resident' | 'organiser'; author_title: string | null;
  event_id: string | null; event_type: 'activity' | 'workshop' | null; event_title: string | null;
  likes: number; viewer_liked: boolean; comment_count: number;
}

const CONTACT = /(\+?6?0\s?1\d[\s-]?\d{3,4}[\s-]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(wa\.me\/)/i;
/** Public text never carries phone numbers or email addresses (privacy and anti-scam). */
export const containsContactDetails = (text: string) => CONTACT.test(text);

/** Newest-first feed of residents' posts; optionally one person's posts for their profile grid. */
export async function listPosts(db: Queryable, viewerId: string, options: { authorId?: string; postId?: string; limit?: number } = {}): Promise<Post[]> {
  const params: unknown[] = [viewerId];
  let where = '';
  if (options.authorId) { params.push(options.authorId); where = `where p.author_id = $${params.length}`; }
  if (options.postId) { if (!/^[0-9a-f-]{36}$/i.test(options.postId)) return []; params.push(options.postId); where = `where p.id = $${params.length}`; }
  params.push(Math.min(options.limit ?? 40, 100));
  const rows = await db.query<PostRow>(
    `select p.id, p.caption, p.photo_id, p.static_photo, p.created_at,
            u.id as author_id, u.name as author_name, u.area as author_area, u.avatar_photo_id as author_avatar, u.role as author_role, u.organiser_title as author_title,
            e.id as event_id, e.type as event_type, e.title as event_title,
            (select count(*)::int from post_likes l where l.post_id = p.id) as likes,
            exists (select 1 from post_likes l where l.post_id = p.id and l.user_id = $1) as viewer_liked,
            (select count(*)::int from post_comments c where c.post_id = p.id) as comment_count
       from posts p join users u on u.id = p.author_id left join events e on e.id = p.event_id
       ${where} order by p.created_at desc, p.id limit $${params.length}`,
    params,
  );
  const ids = rows.rows.map((r) => r.id);
  // The latest two comments per post are shown under it; the rest are behind "View all comments".
  const comments = ids.length ? (await db.query<{ id: string; post_id: string; body: string; created_at: Date; author_id: string; name: string; avatar_photo_id: string | null }>(
    `select c.id, c.post_id, c.body, c.created_at, u.id as author_id, u.name, u.avatar_photo_id
       from post_comments c join users u on u.id = c.author_id where c.post_id = any($1::uuid[]) order by c.created_at`,
    [ids],
  )).rows : [];
  return rows.rows.map((r) => ({
    id: r.id, caption: r.caption, photoId: r.photo_id, staticPhoto: r.static_photo, createdAt: r.created_at,
    author: { id: r.author_id, name: r.author_name, area: r.author_area, avatarPhotoId: r.author_avatar, role: r.author_role, organiserTitle: r.author_title },
    event: r.event_id ? { id: r.event_id, type: r.event_type!, title: r.event_title! } : null,
    likes: r.likes, viewerLiked: r.viewer_liked, commentCount: r.comment_count,
    comments: comments.filter((c) => c.post_id === r.id).map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, author: { id: c.author_id, name: c.name, avatarPhotoId: c.avatar_photo_id } })),
  }));
}

export async function createPost(db: Queryable, user: User, input: { caption: string; photoId: string | null; eventId?: string | null }, now: Date): Promise<string> {
  const caption = input.caption.trim();
  if (caption.length > 600) throw new DomainError('VALIDATION_ERROR', 'caption');
  if (!caption && !input.photoId) throw new DomainError('VALIDATION_ERROR', 'empty');
  if (containsContactDetails(caption)) throw new DomainError('VALIDATION_ERROR', 'contact details');
  if (input.eventId && !(await db.query('select 1 from events where id = $1', [input.eventId])).rows.length) throw new DomainError('NOT_FOUND', 'event');
  return (await db.query<{ id: string }>('insert into posts (author_id, caption, photo_id, event_id, created_at) values ($1, $2, $3, $4, $5) returning id', [user.id, caption, input.photoId, input.eventId || null, now])).rows[0]!.id;
}

/** Like or unlike. Repeating the same action changes nothing. */
export async function setLike(db: Queryable, user: User, postId: string, liked: boolean): Promise<void> {
  if (!(await db.query('select 1 from posts where id = $1', [postId])).rows.length) throw new DomainError('NOT_FOUND');
  if (liked) await db.query('insert into post_likes (post_id, user_id) values ($1, $2) on conflict do nothing', [postId, user.id]);
  else await db.query('delete from post_likes where post_id = $1 and user_id = $2', [postId, user.id]);
}

export async function addComment(db: Queryable, user: User, postId: string, text: string, now: Date): Promise<void> {
  const body = text.trim();
  if (body.length < 1 || body.length > 300) throw new DomainError('VALIDATION_ERROR');
  if (containsContactDetails(body)) throw new DomainError('VALIDATION_ERROR', 'contact details');
  if (!(await db.query('select 1 from posts where id = $1', [postId])).rows.length) throw new DomainError('NOT_FOUND');
  await db.query('insert into post_comments (post_id, author_id, body, created_at) values ($1, $2, $3, $4)', [postId, user.id, body, now]);
}

export async function deletePost(db: Queryable, user: User, postId: string): Promise<void> {
  const row = (await db.query<{ author_id: string }>('select author_id from posts where id = $1', [postId])).rows[0];
  if (!row) throw new DomainError('NOT_FOUND');
  if (row.author_id !== user.id) throw new DomainError('FORBIDDEN');
  await db.query('delete from posts where id = $1', [postId]);
}
