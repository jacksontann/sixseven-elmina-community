/** Areas (precincts) of City of Elmina. Boundaries are approximate; a profile shows only the area, never the address. */
export const AREAS = ['Elmina West', 'Elmina East', 'Elmina Valley', 'Elmina Green', 'Elmina Gardens', 'Elmina Ridge', 'Denai Alam', 'Bukit Subang'] as const;
export type Area = (typeof AREAS)[number];

/** Activity categories (anyone can host). */
export const ACTIVITY_CATEGORIES = ['Sports', 'Walks & runs', 'Outdoors', 'Social', 'Family', 'Volunteering'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

/** Workshop topics (organisers host). Climate workshops follow the monthly climate theme. */
export const WORKSHOP_TOPICS = ['Climate', 'Yoga', 'Wellness'] as const;
export type WorkshopTopic = (typeof WORKSHOP_TOPICS)[number];

export const MATERIALS = ['paper', 'plastic', 'metal', 'glass', 'ewaste', 'oil', 'clothes'] as const;
export type Material = (typeof MATERIALS)[number];
export const MATERIAL_LABELS: Record<Material, string> = {
  paper: 'Paper & cardboard',
  plastic: 'Plastic',
  metal: 'Metal & cans',
  glass: 'Glass',
  ewaste: 'E-waste',
  oil: 'Used cooking oil',
  clothes: 'Clothes & fabric',
};

export type Role = 'resident' | 'organiser';
export type EventType = 'activity' | 'workshop';

/** The signed-in person. Always loaded server-side from the database, never from the client. */
export interface User {
  id: string;
  email: string;
  name: string;
  area: Area;
  bio: string;
  avatarPhotoId: string | null;
  role: Role;
  organiserTitle: string | null;
  isSample: boolean;
}

/** What other residents may see about someone. Email and house address are never included. */
export interface PublicProfile {
  id: string;
  name: string;
  area: Area;
  bio: string;
  avatarPhotoId: string | null;
  role: Role;
  organiserTitle: string | null;
  isSample: boolean;
}

/** Stable warm hue for an initials avatar. */
export function avatarHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}
