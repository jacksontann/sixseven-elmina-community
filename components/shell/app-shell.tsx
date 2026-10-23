import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { User } from '@/lib/domain/types';
import { Avatar } from '@/components/avatar';
import { BottomNav, CreateMenu, SideNav } from './nav';
import { logOutAction } from '@/app/actions/auth';

export function Logo() {
  return <Link href="/" className="logo"><span className="logo-mark" aria-hidden>e</span><span>elmina<span className="logo-dot">.</span></span><span className="sr-only"> home</span></Link>;
}

export const FOOTER_NOTE = 'Prototype for the SDP University Hackathon. Sample residents and data. Not an official Sime Darby Property service.';

/** Signed-in layout: sidebar on desktop, top bar and bottom tabs on phones. */
export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <Logo />
        <SideNav />
        <div className="grid gap-2">
          <p className="eyebrow">Create</p>
          <CreateMenu isOrganiser={user.role === 'organiser'} />
        </div>
        <div className="mt-auto grid gap-3">
          <Link href="/profile" className="row font-semibold"><Avatar person={user} size={36} />{user.name}</Link>
          <form action={logOutAction}><button type="submit" className="btn btn-secondary btn-block"><LogOut size={18} aria-hidden />Log out</button></form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="topbar">
          <Logo />
          <div className="row">
            <Link href="/profile" aria-label="Your profile"><Avatar person={user} size={34} /></Link>
            <form action={logOutAction}><button type="submit" className="icon-btn" aria-label="Log out"><LogOut size={20} aria-hidden /></button></form>
          </div>
        </header>
        <main id="main" className="main" tabIndex={-1}>{children}</main>
        <p className="footer-note">{FOOTER_NOTE} <Link href="/credits" className="underline">Photo credits</Link></p>
      </div>
      <BottomNav isOrganiser={user.role === 'organiser'} />
    </div>
  );
}
