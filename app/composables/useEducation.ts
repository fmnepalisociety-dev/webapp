import type {EducationItem, Session} from '~/types/education';
import {upcomingSessions as recurrenceSessions} from '~/composables/useRecurrence';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

const TABLE = 'education';

/** The next `count` upcoming sessions for an education item. */
export function upcomingSessions(item: EducationItem, count = 5): Session[] {
  return recurrenceSessions(item.event_date, item.recurrence_freq, item.cancelled_dates ?? [], count);
}

/** Fetch a single education item by id (used when an event links to it). */
export async function getEducationItem(id: number | string): Promise<EducationItem | null> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching education item:', error);
    return null;
  }
  return data as EducationItem;
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
