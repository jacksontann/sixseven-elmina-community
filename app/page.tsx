import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarHeart, GraduationCap, ImagePlus, Leaf, Recycle } from 'lucide-react';
import { getContext } from '@/lib/context';
import { listPosts } from '@/lib/domain/posts';
import { listEvents, monthlyTheme } from '@/lib/domain/events';
import { PostCard } from '@/components/post-card';
import { Avatar } from '@/components/avatar';
import { Logo, FOOTER_NOTE } from '@/components/shell/app-shell';

export default async function Home() {
  const ctx = await getContext();
  if (!ctx.user) return <Welcome />;
  const { db, user, now, fmt, timeZone } = ctx;
  const [posts, theme, soon, workshops] = await Promise.all([
    listPosts(db, user.id),
    monthlyTheme(db, now, timeZone),
    listEvents(db, user.id, now, { type: 'activity', limit: 3 }),
    listEvents(db, user.id, now, { type: 'workshop', monthlyClimate: true, limit: 1 }),
  ]);
  const featured = workshops[0];
  return (
    <div className="feed-layout">
      <div className="stack">
        <div className="page-head"><p className="eyebrow">Home</p><h1>What’s new in Elmina</h1></div>
        {theme && <Link href="/workshops" className="theme-banner block lg:hidden"><span className="badge"><Leaf size={13} aria-hidden />{fmt.month(now)} workshop theme</span><p className="mt-2 text-lg font-bold text-white">{theme.title}</p><p className="small">Learn together this month →</p></Link>}
        <Link href="/post/new" className="card card-pad row" aria-label="Create a new post"><Avatar person={user} size={40} /><span className="input flex-1 text-muted">Share something with your neighbours…</span><ImagePlus size={22} className="text-primary" aria-hidden /></Link>
        {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} now={now} fmt={fmt} />) : <p className="empty">No posts yet. Be the first to share something!</p>}
      </div>
      <aside className="hidden lg:grid gap-4 self-start sticky top-8" aria-label="This month">
        {theme && <section className="theme-banner grid gap-2"><span className="badge self-start"><Leaf size={13} aria-hidden />{fmt.month(now)} workshop theme</span><h2 className="text-white">{theme.title}</h2><p className="small">{theme.summary}</p>{featured && <Link href={`/workshops/${featured.id}`} className="btn btn-secondary mt-2 text-ink">Join: {featured.title.split(':')[0]}</Link>}</section>}
        <section className="card card-pad grid gap-3"><div className="between"><h2 className="text-base">Coming up nearby</h2><Link href="/activities" className="small font-bold text-primary">See all</Link></div>
          {soon.map((e) => <Link key={e.id} href={`/activities/${e.id}`} className="grid gap-0.5 rounded-xl p-2 hover:bg-surface-2"><span className="font-semibold">{e.title}</span><span className="small muted">{fmt.relativeDay(e.startsAt, now)} · {fmt.time(e.startsAt)} · {e.placeName}</span></Link>)}
          <Link href="/activities/new" className="btn btn-secondary">Host an activity</Link>
        </section>
      </aside>
    </div>
  );
}

function Welcome() {
  return (
    <main id="main" className="welcome">
      <div className="welcome-photos order-2 lg:order-1" aria-hidden>
        <Image src="/photos/rainbow-bridge.jpg" alt="" fill priority sizes="(min-width: 960px) 52vw, 100vw" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <p className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">Jambatan Pelangi (Rainbow Bridge), City of Elmina</p>
      </div>
      <div className="welcome-copy order-1 lg:order-2">
        <Logo />
        <h1>Your neighbours are closer than you think.</h1>
        <p className="text-lg muted">Elmina is the community app for people who live in City of Elmina. Meet neighbours through everyday activities, learn something new at monthly workshops, and do a little good for the planet together.</p>
        <div className="welcome-points">
          <div><span className="icon bg-primary-soft text-primary"><CalendarHeart size={20} aria-hidden /></span><p><strong>Activities</strong><br /><span className="muted">Join a sunset walk, futsal or a river clean-up, or host your own.</span></p></div>
          <div><span className="icon bg-climate-soft text-climate"><GraduationCap size={20} aria-hidden /></span><p><strong>Monthly workshops</strong><br /><span className="muted">Climate topics every month, plus yoga and wellness with local teachers.</span></p></div>
          <div><span className="icon bg-surface-2 text-ink"><Recycle size={20} aria-hidden /></span><p><strong>Your recycling tracker</strong><br /><span className="muted">See how much you recycle each month on your profile.</span></p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/signup" className="btn btn-primary btn-lg">Join your neighbours <ArrowRight size={18} aria-hidden /></Link>
          <Link href="/login" className="btn btn-secondary btn-lg">Log in</Link>
        </div>
        <p className="small muted">{FOOTER_NOTE} <Link href="/credits" className="underline">Photo credits</Link></p>
      </div>
    </main>
  );
}
