/**
 * Time-zone helpers. Storage is always UTC (timestamptz); display and period allocation use the
 * tenant's IANA time zone (Asia/Kuala_Lumpur for the Elmina example). Nothing here relies on the
 * server's local time zone, so results are identical on a UTC server and a Malaysian laptop.
 */

/** City of Elmina is in Malaysia. */
export const TIME_ZONE = 'Asia/Kuala_Lumpur';

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    });
    partsFormatterCache.set(timeZone, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: WEEKDAYS[get('weekday')] ?? 0,
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (positive east of Greenwich). */
export function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converts a wall-clock time in `timeZone` to the UTC instant. Handles offset changes by re-checking. */
export function zonedTimeToUtc(
  wall: { year: number; month: number; day: number; hour?: number; minute?: number },
  timeZone: string,
): Date {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour ?? 0, wall.minute ?? 0);
  let instant = guess - timeZoneOffsetMs(new Date(guess), timeZone);
  const second = guess - timeZoneOffsetMs(new Date(instant), timeZone);
  if (second !== instant) instant = second;
  return new Date(instant);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Calendar date key (YYYY-MM-DD) of `date` in `timeZone`. */
export function dayKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Calendar month key (YYYY-MM) of `date` in `timeZone`. */
export function monthKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}`;
}

/** UTC instant at which the zoned calendar month `key` (YYYY-MM) starts. */
export function monthStart(key: string, timeZone: string): Date {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return zonedTimeToUtc({ year: y, month: m, day: 1 }, timeZone);
}

/** Month key immediately after `key`. */
export function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
}

export function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

/** Start of the zoned calendar day containing `date`, plus `days` whole days. */
export function zonedDayStart(date: Date, timeZone: string, days = 0): Date {
  const p = zonedParts(date, timeZone);
  const base = Date.UTC(p.year, p.month - 1, p.day + days);
  const d = new Date(base);
  return zonedTimeToUtc({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }, timeZone);
}

/** Wall-clock time `hh:mm` on the zoned day `dayOffset` days after `base`. */
export function atZonedTime(base: Date, timeZone: string, dayOffset: number, hhmm: string): Date {
  const [hour, minute] = hhmm.split(':').map(Number) as [number, number];
  const p = zonedParts(base, timeZone);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + dayOffset));
  return zonedTimeToUtc({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour, minute }, timeZone);
}

/** Parses form inputs `YYYY-MM-DD` and `HH:MM` as a wall-clock time in `timeZone`. Null when malformed. */
export function parseLocalDateTime(date: string, time: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [year, month, day, hour, minute] = [Number(d[1]), Number(d[2]), Number(d[3]), Number(t[1]), Number(t[2])];
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return zonedTimeToUtc({ year, month, day, hour, minute }, timeZone);
}

/** The `YYYY-MM-DD` and `HH:MM` form values for an instant in `timeZone`. */
export function toLocalInputs(date: Date, timeZone: string): { date: string; time: string } {
  const p = zonedParts(date, timeZone);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}
