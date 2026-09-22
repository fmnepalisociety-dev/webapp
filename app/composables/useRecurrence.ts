import type {RecurrenceFreq, Session} from '~/types/recurrence';

/* -----------------------------
 * Local-date helpers
 * A bare "YYYY-MM-DD" parses as UTC midnight, which shifts a day in western
 * timezones. Build/read dates in local time so the weekday is always right.
 * --------------------------- */

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function stepDate(d: Date, freq: RecurrenceFreq) {
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'biweekly') d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
}

/**
 * The next `count` upcoming sessions (today or later) from an anchor date and
 * recurrence. Cancelled dates are still returned (flagged) so they can be shown
 * struck through, but don't count toward `count`. With no recurrence, the anchor
 * itself is the only session (returned only if it's today or later).
 */
export function upcomingSessions(
  anchorIso: string | null,
  freq: RecurrenceFreq | null,
  cancelled: string[] = [],
  count = 5
): Session[] {
  if (!anchorIso) return [];

  const anchor = parseLocalDate(anchorIso);
  const skip = new Set(cancelled);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: Session[] = [];

  if (!freq) {
    if (anchor >= today) out.push({iso: anchorIso, date: anchor, cancelled: skip.has(anchorIso)});
    return out;
  }

  const cur = new Date(anchor);
  let guard = 0;
  while (cur < today && guard++ < 2000) stepDate(cur, freq);

  let kept = 0;
  guard = 0;
  while (kept < count && guard++ < 2000) {
    const iso = toIsoDate(cur);
    const isCancelled = skip.has(iso);
    out.push({iso, date: new Date(cur), cancelled: isCancelled});
    if (!isCancelled) kept++;
    stepDate(cur, freq);
  }
  return out;
}

/** The next non-cancelled session (today or later), or null if none. */
export function nextSession(
  anchorIso: string | null,
  freq: RecurrenceFreq | null,
  cancelled: string[] = []
): Session | null {
  return upcomingSessions(anchorIso, freq, cancelled, 1).find((s) => !s.cancelled) ?? null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Human label for a recurrence, e.g. "Weekly on Fridays". */
export function recurrenceLabel(anchorIso: string | null, freq: RecurrenceFreq | null): string {
  if (!freq) return '';
  if (freq === 'monthly') return 'Monthly';
  const name = anchorIso ? WEEKDAYS[parseLocalDate(anchorIso).getDay()] : '';
  if (!name) return freq === 'weekly' ? 'Weekly' : 'Every other week';
  return freq === 'weekly' ? `Weekly on ${name}s` : `Every other ${name}`;
}
