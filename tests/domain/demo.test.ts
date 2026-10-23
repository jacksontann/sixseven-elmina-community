import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/db/types';
import { DomainError } from '@/lib/domain/errors';
import { cancelEvent, createEvent, eventsForProfile, getEvent, joinEvent, leaveEvent, listEvents, listPlaces, monthlyTheme } from '@/lib/domain/events';
import { cleanPhoto, storePhoto } from '@/lib/domain/photos';
import { addComment, createPost, deletePost, listPosts, setLike } from '@/lib/domain/posts';
import { deleteRecycling, logRecycling, recyclingSummary } from '@/lib/domain/recycling';
import { getOwnAddress, getProfile, logIn, profileStats, signUp, updateProfile } from '@/lib/domain/users';
import { DEMO_PASSWORD } from '@/lib/demo/seed';
import { HOUR_MS, DAY_MS, TIME_ZONE } from '@/lib/time';
import { NOW, eventId, sampleUser, seededDb } from '../helpers/db';

const code = async (p: Promise<unknown>) => p.then(() => 'ok', (e: unknown) => (e instanceof DomainError ? e.code : String(e)));
const newResident = (db: Database, n: number) => signUp(db, { name: `Tester ${n}`, email: `tester${n}@example.org`, password: 'long-enough-1', houseAddress: `${n} Jalan Elmina 1/1`, area: 'Elmina West', acceptedTerms: true });

let db: Database;
beforeEach(async () => { db = await seededDb(); });

describe('sign up and log in', () => {
  it('creates a resident whose house address stays private', async () => {
    const user = await signUp(db, { name: '  Jackson ', email: 'Jackson@Example.org', password: 'long-enough-1', houseAddress: '12 Jalan Elmina 2/3', area: 'Elmina Gardens', acceptedTerms: true });
    expect(user).toMatchObject({ name: 'Jackson', email: 'jackson@example.org', role: 'resident', isSample: false });
    expect(await getOwnAddress(db, user.id)).toBe('12 Jalan Elmina 2/3');
    const profile = await getProfile(db, user.id);
    expect(JSON.stringify(profile)).not.toMatch(/Jalan|jackson@/i);
    expect((await logIn(db, ' JACKSON@example.org ', 'long-enough-1')).id).toBe(user.id);
  });

  it('rejects a duplicate email, missing address, and unaccepted terms', async () => {
    const base = { name: 'A', email: 'aina@example.com', password: 'long-enough-1', houseAddress: '1 Jalan Elmina', area: 'Elmina West', acceptedTerms: true };
    expect(await code(signUp(db, base))).toBe('EMAIL_TAKEN');
    expect(await code(signUp(db, { ...base, email: 'x@example.org', houseAddress: ' ' }))).toBe('VALIDATION_ERROR');
    expect(await code(signUp(db, { ...base, email: 'x@example.org', acceptedTerms: false }))).toBe('VALIDATION_ERROR');
    expect(await code(signUp(db, { ...base, email: 'x@example.org', area: 'Mars' }))).toBe('VALIDATION_ERROR');
  });

  it('gives the same error for an unknown email and a wrong password', async () => {
    expect(await code(logIn(db, 'nobody@example.org', DEMO_PASSWORD))).toBe('BAD_CREDENTIALS');
    expect(await code(logIn(db, 'aina@example.com', 'wrong-password'))).toBe('BAD_CREDENTIALS');
    expect((await logIn(db, 'aina@example.com', DEMO_PASSWORD)).name).toMatch(/Aina/);
  });

  it('updates the profile and can remove the photo', async () => {
    const aina = await sampleUser(db, 'aina');
    const photo = await storePhoto(db, aina.id, 'avatar', await sharp({ create: { width: 50, height: 50, channels: 3, background: '#c2410c' } }).png().toBuffer());
    await updateProfile(db, aina, { name: 'Aina R.', bio: 'Hello Elmina', area: 'Elmina East', avatarPhotoId: photo });
    expect(await getProfile(db, aina.id)).toMatchObject({ name: 'Aina R.', bio: 'Hello Elmina', area: 'Elmina East', avatarPhotoId: photo });
    await updateProfile(db, aina, { name: 'Aina R.', bio: '', area: 'Elmina East', avatarPhotoId: null });
    expect((await getProfile(db, aina.id))!.avatarPhotoId).toBeNull();
  });
});

describe('activities and workshops', () => {
  it('never overfills when many people tap Join at once', async () => {
    const futsal = await eventId(db, 'futsal');
    const viewer = (await sampleUser(db, 'aina')).id;
    expect((await getEvent(db, viewer, futsal))!).toMatchObject({ spots: 12, taken: 10 });
    const people = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => newResident(db, n)));
    const results = await Promise.all(people.map((p) => code(joinEvent(db, p, futsal, NOW))));
    expect(results.filter((r) => r === 'ok')).toHaveLength(2);
    expect(results.filter((r) => r === 'EVENT_FULL')).toHaveLength(4);
    expect((await getEvent(db, viewer, futsal))!.taken).toBe(12);
  });

  it('joining twice is harmless and leaving frees the spot', async () => {
    const futsal = await eventId(db, 'futsal');
    const [a, b, c] = await Promise.all([1, 2, 3].map((n) => newResident(db, n)));
    expect(await joinEvent(db, a!, futsal, NOW)).toBe('joined');
    expect(await joinEvent(db, a!, futsal, NOW)).toBe('already');
    expect(await joinEvent(db, b!, futsal, NOW)).toBe('joined');
    expect(await code(joinEvent(db, c!, futsal, NOW))).toBe('EVENT_FULL');
    await leaveEvent(db, a!, futsal);
    expect(await joinEvent(db, c!, futsal, NOW)).toBe('joined');
  });

  it('rejects joining your own, an ended, or a cancelled event', async () => {
    const hafiz = await sampleUser(db, 'hafiz');
    const aina = await sampleUser(db, 'aina');
    const futsal = await eventId(db, 'futsal');
    expect(await code(joinEvent(db, hafiz, futsal, NOW))).toBe('CONFLICT');
    expect(await code(joinEvent(db, aina, futsal, new Date(NOW.getTime() + 10 * DAY_MS)))).toBe('EVENT_CLOSED');
    expect(await code(cancelEvent(db, aina, futsal, NOW))).toBe('FORBIDDEN');
    await cancelEvent(db, hafiz, futsal, NOW);
    expect(await code(joinEvent(db, aina, futsal, NOW))).toBe('EVENT_CLOSED');
    expect((await listEvents(db, aina.id, NOW, { type: 'activity' })).some((e) => e.id === futsal)).toBe(false);
  });

  it('lets any resident host an activity, but only organisers host workshops', async () => {
    const aina = await sampleUser(db, 'aina');
    const drsiti = await sampleUser(db, 'drsiti');
    const [place] = await listPlaces(db);
    const startsAt = new Date(NOW.getTime() + 2 * DAY_MS);
    const input = { title: 'Evening badminton', description: 'Casual games.', category: 'Sports', placeId: place!.id, startsAt, endsAt: new Date(startsAt.getTime() + 2 * HOUR_MS), spots: 8 };
    const activity = await createEvent(db, aina, { type: 'activity', ...input }, NOW);
    expect((await listEvents(db, aina.id, NOW, { type: 'activity', q: 'badminton' })).map((e) => e.id)).toContain(activity);
    expect((await eventsForProfile(db, aina.id, aina.id, NOW)).hosting.map((e) => e.id)).toContain(activity);

    const workshop = { ...input, type: 'workshop' as const, title: 'Heat-smart homes', category: 'Climate', isMonthlyClimate: true, spots: 40 };
    expect(await code(createEvent(db, aina, workshop, NOW))).toBe('FORBIDDEN');
    const id = await createEvent(db, drsiti, workshop, NOW);
    expect((await listEvents(db, aina.id, NOW, { type: 'workshop', monthlyClimate: true })).map((e) => e.id)).toContain(id);
    expect(await code(createEvent(db, drsiti, { ...workshop, category: 'Yoga' }, NOW))).toBe('VALIDATION_ERROR');
  });

  it('rejects bad times and spot counts', async () => {
    const aina = await sampleUser(db, 'aina');
    const [place] = await listPlaces(db);
    const at = (h: number) => new Date(NOW.getTime() + h * HOUR_MS);
    const input = { type: 'activity' as const, title: 'Walk', description: '', category: 'Walks & runs', placeId: place!.id, startsAt: at(2), endsAt: at(3), spots: 10 };
    expect(await code(createEvent(db, aina, { ...input, startsAt: at(-1) }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(createEvent(db, aina, { ...input, endsAt: at(1) }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(createEvent(db, aina, { ...input, spots: 1 }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(createEvent(db, aina, { ...input, spots: 51 }, NOW))).toBe('VALIDATION_ERROR');
    expect(await createEvent(db, aina, input, NOW)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('has a climate theme for this month and climate workshops in the sample data', async () => {
    expect((await monthlyTheme(db, NOW, TIME_ZONE))!.title).toBe('Recycle right');
    const aina = await sampleUser(db, 'aina');
    expect((await listEvents(db, aina.id, NOW, { type: 'workshop', monthlyClimate: true })).length).toBeGreaterThanOrEqual(3);
  });
});

describe('posts', () => {
  it('likes are idempotent and comments show on the post', async () => {
    const aina = await sampleUser(db, 'aina');
    const [post] = await listPosts(db, aina.id, { limit: 1 });
    const before = post!.likes;
    await setLike(db, aina, post!.id, true);
    await setLike(db, aina, post!.id, true);
    let [after] = await listPosts(db, aina.id, { postId: post!.id });
    expect(after).toMatchObject({ likes: before + (post!.viewerLiked ? 0 : 1), viewerLiked: true });
    await setLike(db, aina, post!.id, false);
    [after] = await listPosts(db, aina.id, { postId: post!.id });
    expect(after!.viewerLiked).toBe(false);

    await addComment(db, aina, post!.id, 'Looks lovely!', NOW);
    [after] = await listPosts(db, aina.id, { postId: post!.id });
    expect(after!.comments.at(-1)).toMatchObject({ body: 'Looks lovely!', author: { id: aina.id } });
  });

  it('blocks phone numbers and emails, and only the author can delete', async () => {
    const aina = await sampleUser(db, 'aina');
    const hafiz = await sampleUser(db, 'hafiz');
    expect(await code(createPost(db, aina, { caption: 'WhatsApp me 012-345 6789', photoId: null }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(createPost(db, aina, { caption: 'email me at a@b.co', photoId: null }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(createPost(db, aina, { caption: ' ', photoId: null }, NOW))).toBe('VALIDATION_ERROR');
    const id = await createPost(db, aina, { caption: 'Great walk this morning', photoId: null, eventId: await eventId(db, 'Morning walk') }, NOW);
    expect((await listPosts(db, hafiz.id, { postId: id }))[0]!.event).toMatchObject({ title: 'Morning walk + kopi' });
    expect(await code(deletePost(db, hafiz, id))).toBe('FORBIDDEN');
    expect((await profileStats(db, aina.id, NOW)).posts).toBeGreaterThan(0);
    await deletePost(db, aina, id);
    expect(await listPosts(db, aina.id, { postId: id })).toHaveLength(0);
  });

  it('re-encodes photos to a fixed size and strips location metadata', async () => {
    const original = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: '#166534' } })
      .withExif({ IFD0: { Make: 'TestCam', Copyright: 'secret' } }).jpeg().toBuffer();
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const clean = await cleanPhoto(original, 'post');
    const meta = await sharp(clean.image).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: 1080, height: 1080 });
    expect(meta.exif).toBeUndefined();
    expect(await code(cleanPhoto(new TextEncoder().encode('<svg></svg>'), 'post'))).toBe('BAD_PHOTO');
  });
});

describe('recycling tracker', () => {
  it('totals this month, last month and by material, and only the owner can delete', async () => {
    const user = await newResident(db, 9);
    await logRecycling(db, user, { material: 'plastic', kg: 1.5 }, NOW);
    await logRecycling(db, user, { material: 'paper', kg: 2 }, NOW);
    await logRecycling(db, user, { material: 'plastic', kg: 0.5 }, new Date(NOW.getTime() - 40 * DAY_MS));
    expect(await code(logRecycling(db, user, { material: 'gold', kg: 1 }, NOW))).toBe('VALIDATION_ERROR');
    expect(await code(logRecycling(db, user, { material: 'paper', kg: 0 }, NOW))).toBe('VALIDATION_ERROR');
    const s = await recyclingSummary(db, user.id, NOW, TIME_ZONE);
    expect(s).toMatchObject({ monthKg: 3.5, lastMonthKg: 0.5, totalKg: 4 });
    expect(s.byMaterial.map((m) => m.material)).toEqual(['paper', 'plastic']);

    const other = await sampleUser(db, 'aina');
    await deleteRecycling(db, other, s.recent[0]!.id);
    expect((await recyclingSummary(db, user.id, NOW, TIME_ZONE)).recent).toHaveLength(3);
    await deleteRecycling(db, user, s.recent[0]!.id);
    expect((await recyclingSummary(db, user.id, NOW, TIME_ZONE)).recent).toHaveLength(2);
  });
});
