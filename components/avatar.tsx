import Link from 'next/link';
import { avatarHue } from '@/lib/domain/types';

/** Profile photo, or warm coloured initials when the person hasn't added one. */
export function Avatar({ person, size = 40, link = false }: { person: { id: string; name: string; avatarPhotoId: string | null }; size?: number; link?: boolean }) {
  const initials = person.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const face = (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: person.avatarPhotoId ? undefined : `hsl(${avatarHue(person.id)} 45% 30%)` }}>
      {person.avatarPhotoId ? <img src={`/api/photos/${person.avatarPhotoId}`} alt="" width={size} height={size} loading="lazy" /> : <span aria-hidden>{initials}</span>}
    </span>
  );
  return link ? <Link href={`/u/${person.id}`} aria-label={`${person.name}'s profile`}>{face}</Link> : face;
}
