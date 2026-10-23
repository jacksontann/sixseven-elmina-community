import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import { getContext } from '@/lib/context';
import { AppShell } from '@/components/shell/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Elmina · Your neighbours are closer than you think', template: '%s · Elmina' },
  description: 'A community app for City of Elmina residents: join and host activities, learn at monthly workshops, and track your recycling. Prototype with sample data.',
  robots: { index: false, follow: false },
  icons: { icon: '/icons/elmina.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#C2410C' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getContext();
  return (
    <html lang="en">
      <body>{user ? <AppShell user={user}>{children}</AppShell> : children}</body>
    </html>
  );
}
