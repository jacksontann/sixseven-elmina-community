'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarHeart, CalendarPlus, Camera, GraduationCap, Home, Plus, UserRound } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/activities', label: 'Activities', icon: CalendarHeart },
  { href: '/workshops', label: 'Workshops', icon: GraduationCap },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

const isCurrent = (path: string, href: string) => (href === '/' ? path === '/' || path.startsWith('/post') : path.startsWith(href) || (href === '/profile' && path.startsWith('/u/')));

/** Desktop sidebar links. */
export function SideNav() {
  const path = usePathname();
  return <nav aria-label="Main" className="grid gap-1">{ITEMS.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-link" aria-current={isCurrent(path, href) ? 'page' : undefined}><Icon size={22} aria-hidden />{label}</Link>)}</nav>;
}

/** Mobile bottom bar: four tabs with the create button in the middle. */
export function BottomNav({ isOrganiser }: { isOrganiser: boolean }) {
  const path = usePathname();
  const link = ({ href, label, icon: Icon }: (typeof ITEMS)[number]) => <Link key={href} href={href} className="nav-link" aria-current={isCurrent(path, href) ? 'page' : undefined}><Icon size={23} aria-hidden />{label}</Link>;
  return (
    <nav aria-label="Main" className="bottom-nav">
      {ITEMS.slice(0, 2).map(link)}
      <details className="nav-create relative">
        <summary aria-label="Create"><Plus size={26} aria-hidden /></summary>
        <CreateMenu isOrganiser={isOrganiser} />
      </details>
      {ITEMS.slice(2).map(link)}
    </nav>
  );
}

export function CreateMenu({ isOrganiser }: { isOrganiser: boolean }) {
  return (
    <div className="create-menu">
      <Link href="/post/new"><Camera size={22} className="shrink-0 text-primary" aria-hidden /><span>New post<small>Share a photo with your neighbours</small></span></Link>
      <Link href="/activities/new"><CalendarPlus size={22} className="shrink-0 text-primary" aria-hidden /><span>Host an activity<small>Walk, game, clean-up, anything</small></span></Link>
      {isOrganiser && <Link href="/workshops/new"><GraduationCap size={22} className="shrink-0 text-climate" aria-hidden /><span>Host a workshop<small>For organisers and teachers</small></span></Link>}
    </div>
  );
}
