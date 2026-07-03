import type {Flyer, TimeboundMeta} from '~/types/flyer';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

export async function getActiveFlyers(): Promise<Flyer[]> {
  const {$supabase} = useNuxtApp();

  const {data, error} = await $supabase
    .from('flyers')
    .select('*')
    .eq('active', true)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching flyers:', error);
    return [];
  }

  const now = new Date();

  return (data as Flyer[]).filter((flyer) => {
    if (flyer.type === 'timebound') {
      const meta = flyer.metadata as TimeboundMeta | null;
      if (!meta?.start_date || !meta?.end_date) return false;
      return now >= new Date(meta.start_date) && now <= new Date(meta.end_date);
    }
    return true;
  });
}

/* -----------------------------
 * Admin CRUD
 * --------------------------- */

export interface FlyerInput {
  title: string;
  caption: string | null;
  image_path: string;
  type: Flyer['type'];
  metadata: TimeboundMeta | null;
  active: boolean;
}

/** Fetch every flyer (no date filter) for the admin manager. */
export async function getAllFlyers(): Promise<Flyer[]> {
  const {$supabase} = useNuxtApp();

  const {data, error} = await $supabase
    .from('flyers')
    .select('*')
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching flyers:', error);
    return [];
  }

  return data as Flyer[];
}

export async function createFlyer(input: FlyerInput): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from('flyers').insert(input);
  if (error) console.error('[flyers:create]', error);
  return {error};
}

export async function updateFlyer(
  id: number,
  input: Partial<FlyerInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from('flyers').update(input).eq('id', id);
  if (error) console.error('[flyers:update]', error);
  return {error};
}

export async function deleteFlyer(id: number): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from('flyers').delete().eq('id', id);
  if (error) console.error('[flyers:delete]', error);
  return {error};
}

/**
 * Upload a flyer image to the public bucket under `flyers/<year>/<name>`.
 * Insert-only (no upsert) so it needs just the storage INSERT policy.
 */
export async function uploadFlyerImage(
  file: File,
  year: number
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `flyers/${year}/${safeName}`;

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false});

  if (error) {
    console.error('[flyers:upload]', error);
    return {path: null, error};
  }

  return {path, error: null};
}

/** Best-effort removal of a flyer image from storage. */
export async function deleteFlyerImage(path: string): Promise<void> {
  if (!path) return;
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path]);
  if (error) console.error('[flyers:removeImage]', error);
}
