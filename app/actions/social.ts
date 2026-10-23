'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { runAction, type ActionResult } from '@/lib/actions';
import { DomainError } from '@/lib/domain/errors';
import { PHOTO_MAX_BYTES, storePhoto, type PhotoKind } from '@/lib/domain/photos';
import { addComment, createPost, deletePost, setLike } from '@/lib/domain/posts';
import { cancelEvent, createEvent, joinEvent, leaveEvent } from '@/lib/domain/events';
import { getUser, updateProfile } from '@/lib/domain/users';
import { deleteRecycling, logRecycling } from '@/lib/domain/recycling';
import type { Database } from '@/lib/db/types';
import { TIME_ZONE, parseLocalDateTime } from '@/lib/time';

type State = ActionResult<unknown> | null;
const str = (data: FormData, key: string) => String(data.get(key) ?? '');
const changed = () => revalidatePath('/', 'layout');

/** Optional photo field: cleaned and stored, or null when nothing was chosen. */
async function photoFrom(db: Database, data: FormData, field: string, ownerId: string, kind: PhotoKind): Promise<string | null> {
  const file = data.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > PHOTO_MAX_BYTES) throw new DomainError('BAD_PHOTO');
  return storePhoto(db, ownerId, kind, new Uint8Array(await file.arrayBuffer()));
}

// ---- Profile ----------------------------------------------------------------------------------------------

export async function saveProfileAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('profile', async ({ db, user }) => {
    const photoId = await photoFrom(db, data, 'photo', user.id, 'avatar');
    const address = data.get('houseAddress');
    await updateProfile(db, user, {
      name: data.has('name') ? str(data, 'name') : user.name,
      bio: str(data, 'bio'),
      area: data.has('area') ? str(data, 'area') : user.area,
      houseAddress: typeof address === 'string' ? address : undefined,
      avatarPhotoId: photoId ?? (data.get('removePhoto') === 'on' ? null : undefined),
    });
  });
  if (result.ok) { changed(); if (data.get('then') === 'home') redirect('/'); }
  return result;
}

// ---- Posts --------------------------------------------------------------------------------------------------

export async function createPostAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('post', async ({ db, user, now }) => {
    const photoId = await photoFrom(db, data, 'photo', user.id, 'post');
    return createPost(db, user, { caption: str(data, 'caption'), photoId, eventId: str(data, 'eventId') || null }, now);
  }, { capacity: 10, perSecond: 0.2 });
  if (result.ok) { changed(); redirect('/'); }
  return result;
}

/** Called directly from the like button (optimistic in the browser, idempotent on the server). */
export async function setLikeAction(postId: string, liked: boolean): Promise<ActionResult<unknown>> {
  const result = await runAction('like', ({ db, user }) => setLike(db, user, postId, liked), { capacity: 60, perSecond: 3 });
  if (result.ok) changed();
  return result;
}

export async function commentAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('comment', ({ db, user, now }) => addComment(db, user, str(data, 'postId'), str(data, 'body'), now), { capacity: 20, perSecond: 0.3 });
  if (result.ok) changed();
  return result;
}

export async function deletePostAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('deletePost', ({ db, user }) => deletePost(db, user, str(data, 'postId')));
  if (result.ok) changed();
  return result;
}

// ---- Activities and workshops -------------------------------------------------------------------------

export async function createEventAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const type = str(data, 'type') === 'workshop' ? 'workshop' : 'activity';
  const result = await runAction('host', async ({ db, user, now }) => {
    const date = str(data, 'date');
    const startsAt = parseLocalDateTime(date, str(data, 'start'), TIME_ZONE);
    const endsAt = parseLocalDateTime(date, str(data, 'end'), TIME_ZONE);
    if (!startsAt || !endsAt) throw new DomainError('VALIDATION_ERROR', 'time');
    // Check permission and details before keeping any uploaded cover.
    const fresh = await getUser(db, user.id);
    if (!fresh) throw new DomainError('UNAUTHENTICATED');
    if (type === 'workshop' && fresh.role !== 'organiser') throw new DomainError('FORBIDDEN');
    const coverPhotoId = await photoFrom(db, data, 'cover', user.id, 'cover');
    return createEvent(db, fresh, { type, title: str(data, 'title'), description: str(data, 'description'), category: str(data, 'category'), isMonthlyClimate: data.get('monthlyClimate') === 'on', placeId: str(data, 'placeId'), startsAt, endsAt, spots: Number(data.get('spots')), coverPhotoId }, now);
  }, { capacity: 10, perSecond: 0.2 });
  if (result.ok) { changed(); redirect(`/${type === 'workshop' ? 'workshops' : 'activities'}/${result.data}`); }
  return result;
}

export async function joinEventAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('join', async ({ db, user, now }) => (data.get('leave') === 'yes' ? (await leaveEvent(db, user, str(data, 'eventId')), 'left') : joinEvent(db, user, str(data, 'eventId'), now)));
  if (result.ok) changed();
  return result;
}

export async function cancelEventAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('cancel', ({ db, user, now }) => cancelEvent(db, user, str(data, 'eventId'), now));
  if (result.ok) changed();
  return result;
}

// ---- Recycling tracker --------------------------------------------------------------------------------------

export async function logRecyclingAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('recycle', ({ db, user, now }) => logRecycling(db, user, { material: str(data, 'material'), kg: Number(data.get('kg')) }, now));
  if (result.ok) changed();
  return result;
}

export async function deleteRecyclingAction(_previous: State, data: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction('recycle', ({ db, user }) => deleteRecycling(db, user, str(data, 'id')));
  if (result.ok) changed();
  return result;
}
