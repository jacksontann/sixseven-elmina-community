import { dayKey } from '@/lib/time';

/** Malaysian English date/time display in township time, whatever the server's own time zone is. */
export function createFormatter(timeZone: string) {
  const make = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-MY', { timeZone, ...options });
  const day = make({ weekday: 'short', day: 'numeric', month: 'short' });
  const longDay = make({ weekday: 'long', day: 'numeric', month: 'long' });
  const time = make({ hour: 'numeric', minute: '2-digit', hour12: true });
  const month = make({ month: 'long', year: 'numeric' });
  const shortDate = make({ day: 'numeric', month: 'short' });
  return {
    day: (d: Date) => day.format(d),
    longDay: (d: Date) => longDay.format(d),
    time: (d: Date) => time.format(d).replace(' ', '').toLowerCase(),
    shortDate: (d: Date) => shortDate.format(d),
    month: (d: Date) => month.format(d),
    /** "Today", "Tomorrow" or "Sat, 25 Oct". */
    relativeDay: (d: Date, now: Date) => {
      if (dayKey(d, timeZone) === dayKey(now, timeZone)) return 'Today';
      if (dayKey(d, timeZone) === dayKey(new Date(now.getTime() + 86_400_000), timeZone)) return 'Tomorrow';
      return day.format(d);
    },
    /** Feed-style age: "just now", "5m", "3h", "2d", then a date. */
    ago: (d: Date, now: Date) => {
      const s = Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000));
      if (s < 60) return 'just now';
      if (s < 3600) return `${Math.floor(s / 60)}m`;
      if (s < 86_400) return `${Math.floor(s / 3600)}h`;
      if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d`;
      return shortDate.format(d);
    },
    kg: (n: number) => `${new Intl.NumberFormat('en-MY', { maximumFractionDigits: 1 }).format(n)} kg`,
  };
}

export type Formatter = ReturnType<typeof createFormatter>;
