import type {EducationItem, RecurrenceFreq, Session} from '~/types/education';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

const TABLE = 'education';

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
 * The next `count` upcoming sessions (today or later) for an item, derived from
 * its anchor date and recurrence. Cancelled dates are still returned (flagged)
 * so they can be shown struck through, but don't count toward `count`.
 */
export function upcomingSessions(item: EducationItem, count = 5): Session[] {
  if (!item.event_date) return [];

  const anchor = parseLocalDate(item.event_date);
  const cancelled = new Set(item.cancelled_dates ?? []);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: Session[] = [];

  if (!item.recurrence_freq) {
    if (anchor >= today) out.push({iso: item.event_date, date: anchor, cancelled: cancelled.has(item.event_date)});
    return out;
  }

  const cur = new Date(anchor);
  let guard = 0;
  while (cur < today && guard++ < 2000) stepDate(cur, item.recurrence_freq);

  let kept = 0;
  guard = 0;
  while (kept < count && guard++ < 2000) {
    const iso = toIsoDate(cur);
    const isCancelled = cancelled.has(iso);
    out.push({iso, date: new Date(cur), cancelled: isCancelled});
    if (!isCancelled) kept++;
    stepDate(cur, item.recurrence_freq);
  }
  return out;
}

/** Public list: active education items, newest first. */
export async function getActiveEducation(): Promise<EducationItem[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from(TABLE)
    .select('*')
    .eq('active', true)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching education items:', error);
    return [];
  }
  return data as EducationItem[];
}

/* -----------------------------
 * Admin CRUD
 * --------------------------- */

export type EducationInput = Omit<EducationItem, 'id' | 'created_at'>;

/** Fetch every education item (no active filter) for the admin manager. */
export async function getAllEducation(): Promise<EducationItem[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from(TABLE)
    .select('*')
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching education items:', error);
    return [];
  }
  return data as EducationItem[];
}

export async function createEducation(input: EducationInput): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from(TABLE).insert(input);
  if (error) console.error('[education:create]', error);
  return {error};
}

export async function updateEducation(
  id: number,
  input: Partial<EducationInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from(TABLE).update(input).eq('id', id);
  if (error) console.error('[education:update]', error);
  return {error};
}

export async function deleteEducation(id: number): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from(TABLE).delete().eq('id', id);
  if (error) console.error('[education:delete]', error);
  return {error};
}

/**
 * Upload an education flyer to the public bucket under `education/<year>/<name>`.
 * Insert-only (no upsert) so it needs just the storage INSERT policy.
 */
export async function uploadEducationImage(
  file: File,
  year: number
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `education/${year}/${safeName}`;

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false});

  if (error) {
    console.error('[education:upload]', error);
    return {path: null, error};
  }
  return {path, error: null};
}

/** Best-effort removal of an education flyer from storage. */
export async function deleteEducationImage(path: string): Promise<void> {
  if (!path) return;
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path]);
  if (error) console.error('[education:removeImage]', error);
}
