export type SceneKind = 'move' | 'nature' | 'learn' | 'make' | 'food' | 'family' | 'social' | 'help';

/** Which illustration suits an activity category or workshop topic when no photo is set. */
export const sceneFor = (category: string): SceneKind => ({ Sports: 'move', 'Walks & runs': 'move', Outdoors: 'nature', Social: 'social', Family: 'family', Volunteering: 'help', Climate: 'nature', Yoga: 'nature', Wellness: 'learn' } as Record<string, SceneKind>)[category] ?? 'nature';

/** Original vector artwork: imagined neighbourhood scenes, never a geographic map or SDP asset. */
export function Scene({ category = 'nature', hero = false }: { category?: SceneKind; hero?: boolean }) {
  const warm = ['social', 'food', 'make'].includes(category);
  return <svg viewBox="0 0 560 360" preserveAspectRatio="xMidYMid slice" aria-hidden>
    <rect width="560" height="360" fill={warm ? '#f2dfc5' : '#e4ecd8'} />
    <circle cx="434" cy="77" r="42" fill="#edb56a" />
    <path d="M-40 200Q120 90 290 170T600 145V360H-40Z" fill="#c0d1a6" />
    <path d="M-20 245Q170 170 340 215T590 190V360H-20Z" fill="#88a77c" />
    <path d="M55 360Q190 262 370 285T600 260V360Z" fill="#b9d8d4" />
    <path d="M-20 300Q195 195 376 248T595 225" stroke="#f9e9c9" strokeWidth="24" fill="none" />
    <path d="M-20 300Q195 195 376 248T595 225" stroke="#e6cda5" strokeWidth="2" strokeDasharray="6 8" fill="none" />
    {[{ x:65, y:178, s:1.1 },{ x:490, y:210, s:1.35 },{ x:385, y:158, s:.7 }].map(({ x,y,s }) => <g key={x} transform={`translate(${x},${y}) scale(${s})`}><path d="M0 0V80" stroke="#745c3c" strokeWidth="8" /><ellipse cy="-5" rx="35" ry="52" fill="#426e4b" /><ellipse cx="15" cy="-16" rx="25" ry="37" fill="#608756" /><path d="M0 48L-15 26M0 36L17 8" stroke="#745c3c" strokeWidth="4" fill="none" /></g>)}
    {warm && <g><path d="M170 176h150v70H170Z" fill="#f2ece0" /><path d="M155 177l90-40 90 40Z" fill="#c15c39" /><path d="M185 195h25v30h-25Zm45 0h25v30h-25Zm45 0h25v30h-25Z" fill="#516a5b" /></g>}
    {category === 'move' && <g stroke="#f9f5e7" strokeWidth="4" fill="none"><ellipse cx="267" cy="215" rx="48" ry="21" /><path d="M218 215h95m-47-20v41" /></g>}
    {hero && <g><rect x="147" y="232" width="64" height="10" rx="3" fill="#ad724a" /><path d="M152 242v17m54-17v17" stroke="#715a41" strokeWidth="5" /><path d="M270 239l-3 28m8-28 8 26" stroke="#283d32" strokeWidth="7" strokeLinecap="round" /><path d="M267 215l7 25m-7-16-12 10m16-11 15 6" stroke="#bb532e" strokeWidth="11" strokeLinecap="round" /><circle cx="265" cy="202" r="9" fill="#b57a56" /><path d="M312 246l-7 27m16-27 9 25" stroke="#534b44" strokeWidth="6" strokeLinecap="round" /><path d="M314 219l2 26m0-19-14 12m15-11 12 9" stroke="#e6b55d" strokeWidth="12" strokeLinecap="round" /><circle cx="313" cy="206" r="9" fill="#825a40" /><path d="M310 197q12-6 13 10l-7-3Z" fill="#303e34" /></g>}
    <path d="M118 90q8-8 16 0m6-12q8-8 16 0" stroke="#58725e" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>;
}
