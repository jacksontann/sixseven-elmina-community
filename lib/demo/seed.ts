import type { Database, Queryable } from '@/lib/db/types';
import { hashPassword } from '@/lib/domain/passwords';
import { HOUR_MS, TIME_ZONE, atZonedTime, monthKey, nextMonthKey, previousMonthKey } from '@/lib/time';

/**
 * Sample content so the prototype looks alive. Places are real City of Elmina public places; every person,
 * activity, workshop, post and recycling entry is fictional sample data. Dates are generated relative to the
 * moment of seeding, so activities always look upcoming. Bump SEED_VERSION when this file changes.
 */
export const SEED_VERSION = '3';
export const DEMO_PASSWORD = 'elmina-demo';

const PLACES: [slug: string, name: string, area: string][] = [
  ['central-park', 'Elmina Central Park', 'Elmina West'],
  ['forest-park', 'Forest Park (Central Park)', 'Elmina West'],
  ['community-park', 'Community Park (Central Park)', 'Elmina West'],
  ['sakura-lake', 'Sakura Lake', 'Elmina West'],
  ['urban-park', 'Elmina Urban Park', 'Elmina West'],
  ['lakeside-mall', 'Elmina Lakeside Mall', 'Elmina West'],
  ['rainbow-bridge', 'Jambatan Pelangi (Rainbow Bridge)', 'Elmina West'],
  ['sungai-subang', 'Sungai Subang corridor', 'Elmina West'],
  ['erkc', 'Elmina Rainforest Knowledge Centre (ERKC)', 'Elmina Valley'],
  ['ficus-park', 'Taman Persiaran Ficus', 'Elmina Valley'],
  ['valley-garden', 'Elmina Valley Garden', 'Elmina Valley'],
  ['dewan-u16', 'Dewan Serbaguna U16/1', 'Elmina Valley'],
  ['dewan-refelsia', 'Dewan Refelsia', 'Bukit Subang'],
  ['green-one-park', 'Elmina Green One Park', 'Elmina Green'],
  ['taman-ferrea', 'Taman Ferrea', 'Denai Alam'],
  ['denai-alam-field', 'Denai Alam Football Field', 'Denai Alam'],
];

type Person = { key: string; name: string; area: string; bio: string; role?: 'organiser'; title?: string };
const PEOPLE: Person[] = [
  { key: 'aina', name: 'Aina Rahman', area: 'Elmina Valley', bio: 'Moved to Elmina Valley six months ago with my toddler. Love slow walks, plants and meeting neighbours.' },
  { key: 'hafiz', name: 'Hafiz Iskandar', area: 'Elmina West', bio: 'Futsal and badminton most weeks. Always looking for one more player.' },
  { key: 'meiling', name: 'Mei Ling Tan', area: 'Elmina Green', bio: 'I organise small clean-ups. Gloves provided, good company guaranteed.' },
  { key: 'lim', name: 'Lim Boon Huat', area: 'Denai Alam', bio: 'Retired. Morning walks at 6:30, kopi after. Everyone is welcome.' },
  { key: 'priya', name: 'Priya Kumar', area: 'Elmina Gardens', bio: 'Mum of two. Playgrounds, picnics and nature hunts.' },
  { key: 'nadia', name: 'Nadia Ismail', area: 'Elmina Ridge', bio: 'Sunset walks and amateur photography.' },
  { key: 'daniel', name: 'Daniel Wong', area: 'Bukit Subang', bio: 'Weekend cyclist on the Elmina tracks.' },
  { key: 'sitiaminah', name: 'Siti Aminah', area: 'Elmina East', bio: 'Home cook learning to compost.' },
  { key: 'arjun', name: 'Arjun Nair', area: 'Elmina Valley', bio: 'Training for my first half marathon.' },
  { key: 'farah', name: 'Farah Zulkifli', area: 'Denai Alam', bio: 'New to yoga and loving it.' },
  { key: 'kevin', name: 'Kevin Lee', area: 'Elmina West', bio: 'Board games, coffee and good conversations.' },
  { key: 'zainab', name: 'Zainab Osman', area: 'Elmina Green', bio: 'Gardener and bird watcher.' },
  { key: 'drsiti', name: 'Dr Siti Hajar', area: 'Elmina Valley', bio: 'I run practical climate workshops for families: recycling, composting and staying cool in the heat.', role: 'organiser', title: 'Climate educator' },
  { key: 'amira', name: 'Amira Yusof', area: 'Elmina West', bio: 'Certified yoga teacher. Gentle, all-levels classes outdoors.', role: 'organiser', title: 'Yoga teacher' },
  { key: 'ravi', name: 'Ravi Menon', area: 'Bukit Subang', bio: 'Mindfulness and wellness coach. Breathe, walk, slow down.', role: 'organiser', title: 'Wellness coach' },
];

const THEMES = (now: Date): [string, string, string][] => {
  const current = monthKey(now, TIME_ZONE);
  return [
    [previousMonthKey(current), 'Native trees, cooler streets', 'Why native trees cool our streets and bring wildlife back, and how to look after young trees at home.'],
    [current, 'Recycle right', 'Learn what goes where in Shah Alam, cut contamination, and start a simple recycling habit at home. Then track what you recycle on your profile.'],
    [nextMonthKey(current), 'Heat-smart living', 'Hotter days are more common. Learn to read heat alerts, keep homes cooler and plan outdoor time safely.'],
  ];
};

type EventSeed = { key: string; type: 'activity' | 'workshop'; title: string; description: string; category: string; host: string; place: string; day: number; start: string; end: string; spots: number; cover?: string; climate?: boolean; joiners?: string[] };
const EVENTS: EventSeed[] = [
  { key: 'sunset-walk', type: 'activity', title: 'Sunset walk at Sakura Lake', description: 'An easy 45-minute loop around the lake as the sun goes down. Newcomers very welcome, we walk at a chatting pace.', category: 'Walks & runs', host: 'nadia', place: 'sakura-lake', day: 0, start: '18:30', end: '19:15', spots: 12, cover: '/photos/park-pond.jpg', joiners: ['lim', 'zainab', 'arjun'] },
  { key: 'morning-walk', type: 'activity', title: 'Morning walk + kopi', description: 'Our daily 6:30 walk around Central Park, then kopi together. Go as fast or slow as you like.', category: 'Walks & runs', host: 'lim', place: 'central-park', day: 1, start: '06:30', end: '07:30', spots: 15, cover: '/photos/lake-path.jpg', joiners: ['aina', 'arjun', 'farah', 'nadia'] },
  { key: 'clean-up', type: 'activity', title: 'Sungai Subang river clean-up', description: 'Two hours picking up litter along the river bank. Gloves, bags and water provided. Wear closed shoes.', category: 'Volunteering', host: 'meiling', place: 'sungai-subang', day: 2, start: '08:00', end: '10:00', spots: 25, cover: '/photos/sungai-subang-river.jpg', joiners: ['zainab', 'sitiaminah', 'daniel', 'priya', 'kevin'] },
  { key: 'futsal', type: 'activity', title: 'Futsal night', description: 'Friendly 5-a-side, mixed levels. We split teams on the night.', category: 'Sports', host: 'hafiz', place: 'lakeside-mall', day: 3, start: '20:00', end: '21:30', spots: 12, joiners: ['kevin', 'arjun', 'daniel', 'lim', 'nadia', 'farah', 'zainab', 'priya', 'sitiaminah', 'meiling'] },
  { key: 'rainbow-walk', type: 'activity', title: 'Walk & talk across the Rainbow Bridge', description: 'A relaxed evening walk across Jambatan Pelangi and back. A nice way to meet people in your area.', category: 'Social', host: 'nadia', place: 'rainbow-bridge', day: 4, start: '18:00', end: '19:00', spots: 15, cover: '/photos/rainbow-bridge.jpg', joiners: ['aina', 'kevin'] },
  { key: 'playground', type: 'activity', title: 'Parents & kids playground meet-up', description: 'Kids play, parents chat. Children always stay with their own parent or guardian.', category: 'Family', host: 'priya', place: 'lakeside-mall', day: 5, start: '17:00', end: '18:30', spots: 10, cover: '/photos/playground.jpg', joiners: ['aina'] },
  { key: 'trail-ride', type: 'activity', title: 'Shady trail ride by the river', description: 'A slow 10 km ride on the riverside paths. Bring your own bike and helmet.', category: 'Outdoors', host: 'daniel', place: 'sungai-subang', day: 6, start: '07:30', end: '09:00', spots: 8, cover: '/photos/buggy-path.jpg', joiners: ['arjun'] },
  { key: 'badminton', type: 'activity', title: 'Badminton doubles', description: 'Casual doubles. Court booked by the host. Bring your own racket if you have one.', category: 'Sports', host: 'hafiz', place: 'dewan-u16', day: 6, start: '10:00', end: '12:00', spots: 8, joiners: ['kevin', 'daniel', 'farah'] },
  { key: 'picnic', type: 'activity', title: 'Picnic by the pond', description: 'Bring something to share and a mat. Bird-spotting optional!', category: 'Social', host: 'zainab', place: 'ficus-park', day: 8, start: '17:00', end: '19:00', spots: 20, cover: '/photos/ficus-park-pond.jpg', joiners: ['priya', 'sitiaminah'] },
  { key: 'board-games', type: 'activity', title: 'Board games afternoon', description: 'Bring a game or learn a new one. Indoors and air-conditioned.', category: 'Social', host: 'kevin', place: 'lakeside-mall', day: 9, start: '15:00', end: '17:00', spots: 10, joiners: ['hafiz'] },
  { key: 'sunday-run', type: 'activity', title: 'Easy 5 km run', description: 'Easy pace around Persiaran Ficus. No one gets left behind.', category: 'Walks & runs', host: 'arjun', place: 'ficus-park', day: 10, start: '07:00', end: '08:00', spots: 15, cover: '/photos/ficus-park-path.jpg', joiners: ['lim', 'daniel'] },
  { key: 'garden', type: 'activity', title: 'Community gardening morning', description: 'Herbs, seedlings and tips. Tools shared.', category: 'Outdoors', host: 'zainab', place: 'valley-garden', day: 12, start: '08:00', end: '09:30', spots: 12, joiners: ['sitiaminah'] },
  // Workshops: the monthly climate theme, plus yoga and wellness.
  { key: 'recycle-right', type: 'workshop', title: 'Recycle right: what goes where in Shah Alam', description: 'Which materials local collectors accept, how to avoid contamination, and how to set up a simple recycling corner at home. Bring your questions!', category: 'Climate', host: 'drsiti', place: 'erkc', day: 2, start: '10:00', end: '11:30', spots: 40, climate: true, joiners: ['priya', 'zainab', 'sitiaminah', 'lim', 'meiling'] },
  { key: 'river-care', type: 'workshop', title: 'River care walk: Sungai Subang', description: 'A guided walk to learn why clean rivers matter for flooding and wildlife, and what small actions help.', category: 'Climate', host: 'drsiti', place: 'sungai-subang', day: 7, start: '08:30', end: '10:00', spots: 25, cover: '/photos/sungai-subang-stream.jpg', climate: true, joiners: ['daniel', 'meiling'] },
  { key: 'compost', type: 'workshop', title: 'Composting at home, the easy way', description: 'Turn kitchen scraps into compost in a hot, wet climate, without the smell. Starter tips and a live demo.', category: 'Climate', host: 'drsiti', place: 'valley-garden', day: 11, start: '09:30', end: '11:00', spots: 30, climate: true, joiners: ['sitiaminah', 'zainab'] },
  { key: 'sunrise-yoga', type: 'workshop', title: 'Sunrise yoga on the terraces', description: 'Gentle all-levels yoga outdoors. Bring a mat and water.', category: 'Yoga', host: 'amira', place: 'ficus-park', day: 3, start: '07:00', end: '08:00', spots: 20, cover: '/photos/park-terraces.jpg', joiners: ['farah', 'nadia', 'priya'] },
  { key: 'beginner-yoga', type: 'workshop', title: 'Yoga for complete beginners', description: 'Learn the basic poses and breathing slowly, with lots of options for every body.', category: 'Yoga', host: 'amira', place: 'community-park', day: 9, start: '08:00', end: '09:00', spots: 20, cover: '/photos/park-stone-path.jpg', joiners: ['farah'] },
  { key: 'mindful-walk', type: 'workshop', title: 'Mindful walking in nature', description: 'A slow guided walk to notice, breathe and switch off from screens.', category: 'Wellness', host: 'ravi', place: 'forest-park', day: 5, start: '08:00', end: '09:00', spots: 15, cover: '/photos/sungai-subang-trail.jpg', joiners: ['lim', 'zainab'] },
  { key: 'breathing', type: 'workshop', title: 'Stress-less breathing', description: 'Simple breathing techniques for better sleep and calmer days. Indoors.', category: 'Wellness', host: 'ravi', place: 'dewan-refelsia', day: 13, start: '19:30', end: '20:30', spots: 30, joiners: ['kevin'] },
];

type PostSeed = { author: string; caption: string; photo?: string; hoursAgo: number; event?: string; likes: string[]; comments?: [string, string][] };
const POSTS: PostSeed[] = [
  { author: 'drsiti', caption: 'This month’s theme is Recycle right ♻️ Join my workshop at ERKC to learn what goes where in Shah Alam, then start tracking your recycling on your profile!', photo: '/photos/sungai-subang-stream.jpg', hoursAgo: 2, event: 'recycle-right', likes: ['aina', 'meiling', 'zainab', 'priya', 'lim', 'sitiaminah'], comments: [['meiling', 'See you there! I’ll bring the clean-up crew.'], ['priya', 'Can I bring my kids?'], ['drsiti', 'Of course, families are welcome!']] },
  { author: 'nadia', caption: 'Evening stroll across Jambatan Pelangi 🌈 Doing a walk & talk this week if anyone wants to join.', photo: '/photos/rainbow-bridge.jpg', hoursAgo: 4, event: 'rainbow-walk', likes: ['kevin', 'aina', 'arjun', 'zainab'], comments: [['kevin', 'Count me in!']] },
  { author: 'meiling', caption: 'Scouted the Sungai Subang stretch for our river clean-up. Bring water and closed shoes!', photo: '/photos/sungai-subang-river.jpg', hoursAgo: 7, event: 'clean-up', likes: ['zainab', 'daniel', 'sitiaminah'] },
  { author: 'lim', caption: '6:30am walk done. The lake path is so peaceful before the sun gets hot. Kopi after, as always.', photo: '/photos/lake-path.jpg', hoursAgo: 20, event: 'morning-walk', likes: ['aina', 'arjun', 'farah', 'nadia', 'hafiz'], comments: [['aina', 'Joining you tomorrow, Uncle Lim!']] },
  { author: 'amira', caption: 'Sunrise yoga is back on the terraces. All levels welcome, bring a mat 🧘', photo: '/photos/park-terraces.jpg', hoursAgo: 26, event: 'sunrise-yoga', likes: ['farah', 'nadia', 'priya'] },
  { author: 'priya', caption: 'The kids loved the tiger playground! Any other parents keen for a weekly meet-up?', photo: '/photos/playground.jpg', hoursAgo: 30, event: 'playground', likes: ['aina', 'zainab'], comments: [['aina', 'Yes please! My little one would love it.']] },
  { author: 'hafiz', caption: 'Futsal night was intense 😅 Only 2 spots left for the next one, come join us!', hoursAgo: 40, event: 'futsal', likes: ['kevin', 'arjun', 'daniel'] },
  { author: 'sitiaminah', caption: 'First week separating food waste for compost. Smells much better than I expected 😄', hoursAgo: 46, likes: ['drsiti', 'zainab', 'meiling'] },
  { author: 'daniel', caption: 'Found a lovely shady trail by the river. Perfect for a slow morning ride.', photo: '/photos/buggy-path.jpg', hoursAgo: 52, event: 'trail-ride', likes: ['arjun'] },
  { author: 'zainab', caption: 'Spotted herons at Taman Persiaran Ficus this morning. Picnic here next week, everyone welcome!', photo: '/photos/ficus-park-pond.jpg', hoursAgo: 60, event: 'picnic', likes: ['priya', 'nadia', 'lim'] },
  { author: 'aina', caption: 'Six months in Elmina and I finally found my walking crew. Thank you neighbours 💛', photo: '/photos/park-pond.jpg', hoursAgo: 75, likes: ['lim', 'nadia', 'priya', 'zainab', 'farah'] },
  { author: 'farah', caption: 'Tried my first yoga workshop. So relaxing, highly recommend!', hoursAgo: 80, likes: ['amira', 'nadia'] },
  { author: 'arjun', caption: '5 km around Persiaran Ficus this morning. Who wants to join the next run?', photo: '/photos/ficus-park-path.jpg', hoursAgo: 90, event: 'sunday-run', likes: ['lim', 'daniel'] },
  { author: 'kevin', caption: 'Board games afternoon at the mall soon. Newcomers welcome, I’ll teach you!', photo: '/photos/park-stone-path.jpg', hoursAgo: 100, event: 'board-games', likes: ['hafiz'] },
];

const RECYCLING: [person: string, material: string, kg: number, daysAgo: number][] = [
  ['aina', 'plastic', 2.4, 3], ['aina', 'paper', 3.1, 9], ['aina', 'oil', 1.2, 14], ['aina', 'glass', 4, 35], ['aina', 'paper', 2.5, 40],
  ['meiling', 'plastic', 5.2, 2], ['zainab', 'paper', 6, 5], ['sitiaminah', 'metal', 1.8, 6],
];

const TABLES = ['post_comments', 'post_likes', 'posts', 'event_participants', 'events', 'recycling_logs', 'photos', 'users', 'places', 'monthly_themes'];

export async function seedDemo(db: Database, now = new Date()): Promise<Record<string, number>> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  return db.transaction(async (tx) => {
    await tx.query('update users set avatar_photo_id = null');
    for (const table of TABLES) await tx.query(`delete from ${table}`);
    const place: Record<string, string> = {};
    for (const [i, [slug, name, area]] of PLACES.entries()) place[slug] = (await tx.query<{ id: string }>('insert into places (slug, name, area, sort_order) values ($1, $2, $3, $4) returning id', [slug, name, area, i])).rows[0]!.id;
    const user: Record<string, string> = {};
    for (const [i, p] of PEOPLE.entries()) {
      user[p.key] = (await tx.query<{ id: string }>(
        `insert into users (email, password_hash, name, area, house_address, bio, role, organiser_title, is_sample, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) returning id`,
        [`${p.key}@example.com`, passwordHash, p.name, p.area, `Sample address, ${p.area}, City of Elmina`, p.bio, p.role ?? 'resident', p.title ?? null, new Date(now.getTime() - (200 - i * 7) * 24 * HOUR_MS)],
      )).rows[0]!.id;
    }
    for (const [month, title, summary] of THEMES(now)) await tx.query('insert into monthly_themes (month, title, summary) values ($1, $2, $3)', [month, title, summary]);
    const event: Record<string, string> = {};
    let joins = 0;
    for (const e of EVENTS) {
      let starts = atZonedTime(now, TIME_ZONE, e.day, e.start), ends = atZonedTime(now, TIME_ZONE, e.day, e.end);
      // Today's items that have already finished move to the same time tomorrow, so the demo never looks stale.
      if (ends <= now) { starts = new Date(starts.getTime() + 24 * HOUR_MS); ends = new Date(ends.getTime() + 24 * HOUR_MS); }
      event[e.key] = (await tx.query<{ id: string }>(
        `insert into events (type, title, description, category, is_monthly_climate, host_id, place_id, starts_at, ends_at, spots, cover_image, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
        [e.type, e.title, e.description, e.category, Boolean(e.climate), user[e.host], place[e.place], starts, ends, e.spots, e.cover ?? null, new Date(now.getTime() - 5 * 24 * HOUR_MS)],
      )).rows[0]!.id;
      for (const who of e.joiners ?? []) { await tx.query('insert into event_participants (event_id, user_id, joined_at) values ($1, $2, $3)', [event[e.key], user[who], new Date(now.getTime() - 3 * HOUR_MS)]); joins++; }
    }
    let likes = 0, comments = 0;
    for (const p of POSTS) {
      const created = new Date(now.getTime() - p.hoursAgo * HOUR_MS);
      const id = (await tx.query<{ id: string }>('insert into posts (author_id, caption, static_photo, event_id, created_at) values ($1, $2, $3, $4, $5) returning id', [user[p.author], p.caption, p.photo ?? null, p.event ? event[p.event] : null, created])).rows[0]!.id;
      for (const who of p.likes) { await tx.query('insert into post_likes (post_id, user_id, created_at) values ($1, $2, $3)', [id, user[who], created]); likes++; }
      for (const [i, [who, body]] of (p.comments ?? []).entries()) { await tx.query('insert into post_comments (post_id, author_id, body, created_at) values ($1, $2, $3, $4)', [id, user[who], body, new Date(created.getTime() + (i + 1) * 20 * 60_000)]); comments++; }
    }
    for (const [who, material, kg, daysAgo] of RECYCLING) await tx.query('insert into recycling_logs (user_id, material, kg, logged_at) values ($1, $2, $3, $4)', [user[who], material, kg, new Date(now.getTime() - daysAgo * 24 * HOUR_MS)]);
    await tx.query("insert into app_state (key, value) values ('seed_version', $1) on conflict (key) do update set value = excluded.value", [SEED_VERSION]);
    await tx.query("insert into app_state (key, value) values ('seeded_at', $1) on conflict (key) do update set value = excluded.value", [now.toISOString()]);
    return { places: PLACES.length, people: PEOPLE.length, events: EVENTS.length, joins, posts: POSTS.length, likes, comments, recycling: RECYCLING.length };
  });
}

/** Seeds an empty or outdated database on first start. Existing data from the same seed version is kept. */
export async function ensureSeeded(db: Database): Promise<void> {
  const row = (await (db as Queryable).query<{ value: string }>("select value from app_state where key = 'seed_version'")).rows[0];
  if (row?.value !== SEED_VERSION) await seedDemo(db);
}
