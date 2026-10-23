import Link from 'next/link';
import { getContext } from '@/lib/context';

export const metadata = { title: 'Photo credits' };

/** Attribution for the bundled sample photos (required by CC BY-SA, courtesy for CC0). See docs/media-sources.md. */
const PHOTOS: [file: string, title: string, url: string, author: string, licence: string][] = [
  ['rainbow-bridge', 'Jambatan Pelangi Elmina, Seksyen U15 Shah Alam', 'https://commons.wikimedia.org/wiki/File:Jambatan_Pelangi_Elmina,_Seksyen_U15_Shah_Alam_20231021_093602.jpg', 'Wiki Farazi', 'CC0'],
  ['park-stone-path', 'Elmina (Malaysia) 1', 'https://commons.wikimedia.org/wiki/File:Elmina_(Malaysia)_1.jpg', 'Wiki Farazi', 'CC0'],
  ['park-pond', 'Elmina (Malaysia) 3', 'https://commons.wikimedia.org/wiki/File:Elmina_(Malaysia)_3.jpg', 'Wiki Farazi', 'CC0'],
  ['lake-path', 'Elmina (Malaysia) 7', 'https://commons.wikimedia.org/wiki/File:Elmina_(Malaysia)_7.jpg', 'Wiki Farazi', 'CC0'],
  ['ficus-park-path', 'Taman Persiaran Ficus, Seksyen U15 Shah Alam', 'https://commons.wikimedia.org/wiki/File:Taman_Persiaran_Ficus,_Seksyen_U15_Shah_Alam_20231021_092530.jpg', 'Wiki Farazi', 'CC0'],
  ['ficus-park-pond', 'Taman Persiaran Ficus, Seksyen U15 Shah Alam', 'https://commons.wikimedia.org/wiki/File:Taman_Persiaran_Ficus,_Seksyen_U15_Shah_Alam_20231021_094826.jpg', 'Wiki Farazi', 'CC0'],
  ['park-terraces', 'Taman Persiaran Ficus, Seksyen U15 Shah Alam', 'https://commons.wikimedia.org/wiki/File:Taman_Persiaran_Ficus,_Seksyen_U15_Shah_Alam_20231021_111111.jpg', 'Wiki Farazi', 'CC0'],
  ['sungai-subang-river', 'Sungai Subang, Elmina West', 'https://commons.wikimedia.org/wiki/File:Sungai_Subang,_Elmina_West_20231105_110147.jpg', 'Wiki Farazi', 'CC0'],
  ['sungai-subang-stream', 'Sungai Subang, Elmina West', 'https://commons.wikimedia.org/wiki/File:Sungai_Subang,_Elmina_West_20231105_105946.jpg', 'Wiki Farazi', 'CC0'],
  ['sungai-subang-trail', 'Sungai Subang, Elmina West', 'https://commons.wikimedia.org/wiki/File:Sungai_Subang,_Elmina_West_20231105_123104.jpg', 'Wiki Farazi', 'CC0'],
  ['buggy-path', 'Buggy Path, Elmina West', 'https://commons.wikimedia.org/wiki/File:Buggy_Path,_Elmina_West_20231105_110323.jpg', 'Wiki Farazi', 'CC0'],
  ['playground', 'Elmina Lakeside Mall at night (241012) 09', 'https://commons.wikimedia.org/wiki/File:Elmina_Lakeside_Mall_at_night_(241012)_09.jpg', '*angys*', 'CC BY-SA 4.0'],
];

export default async function Credits() {
  // Inside the signed-in app shell the page is already in <main>.
  const Wrapper = (await getContext()).user ? 'div' : 'main';
  return (
    <Wrapper id={Wrapper === 'main' ? 'main' : undefined} className="narrow grid gap-5 px-4 py-8">
      <Link href="/" className="small font-bold text-primary">← Back</Link>
      <h1>Photo credits</h1>
      <p className="muted">Real photos of City of Elmina from Wikimedia Commons, resized and re-saved without metadata. No Sime Darby Property photos or logos are used. The places are real; all people, activities, workshops and posts in this prototype are sample content.</p>
      <ul className="card card-pad grid gap-3">
        {PHOTOS.map(([file, title, url, author, licence]) => (
          <li key={file} className="small"><a className="font-semibold text-primary underline" href={url} rel="noopener noreferrer" target="_blank">{title}</a> by {author}, {licence === 'CC0' ? 'CC0 (public domain)' : <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener noreferrer" target="_blank">CC BY-SA 4.0</a>}<span className="muted"> · used as {file}.jpg</span></li>
        ))}
      </ul>
      <p className="small muted">Icons: Lucide (ISC). Font: Plus Jakarta Sans (SIL OFL). Fallback illustrations are original artwork drawn in code.</p>
      <p className="small muted">This prototype was built with AI coding assistance (Claude Code and OpenAI Codex).</p>
    </Wrapper>
  );
}
