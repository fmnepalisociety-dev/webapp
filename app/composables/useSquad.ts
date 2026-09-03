import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage'

// A player in a sports squad. `sport` groups by discipline (e.g. football,
// cricket, volleyball); `team` is the tournament/season (e.g. Everest Cup 2026).
// `role` is 'captain' | 'vice-captain' | null. `squad_number` is the jersey /
// list number. `image_path` points into the public `nsfm` storage bucket.
export interface SquadPlayer {
  id: string
  name: string
  sport: string
  squad_number: number | null
  role: string | null
  team: string
  image_path: string | null
  sort_order: number
}

export type SquadPlayerInput = Omit<SquadPlayer, 'id'>

const SQUAD_COLUMNS = 'id, name, sport, squad_number, role, team, image_path, sort_order'

export const FOOTBALL = 'football'
export const EVEREST_CUP_2026 = 'Everest Cup 2026'

export async function getSquad(
  sport = FOOTBALL,
  team = EVEREST_CUP_2026
): Promise<SquadPlayer[]> {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase
    .from('players')
    .select(SQUAD_COLUMNS)
    .eq('sport', sport)
    .eq('team', team)
    .order('sort_order', {ascending: true})
  if (error) {
    console.error('[squad:getAll]', error)
    return []
  }
  return (data as SquadPlayer[]) ?? []
}

export async function createPlayer(input: SquadPlayerInput): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('players').insert(input)
  if (error) console.error('[squad:create]', error)
  return {error}
}

export async function updatePlayer(
  id: string,
  input: Partial<SquadPlayerInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('players').update(input).eq('id', id)
  if (error) console.error('[squad:update]', error)
  return {error}
}

export async function deletePlayer(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('players').delete().eq('id', id)
  if (error) console.error('[squad:delete]', error)
  return {error}
}

// Upload a player photo to `squad/<prefix><name>`; returns its storage path.
export async function uploadPlayerImage(
  file: File,
  prefix = ''
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const cleanPrefix = prefix ? `${prefix.replace(/[^a-zA-Z0-9.-]/g, '_')}-` : ''
  const path = `squad/${cleanPrefix}${safeName}`

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: true})

  if (error) {
    console.error('[squad:upload]', error)
    return {path: null, error}
  }
  return {path, error: null}
}

export async function deletePlayerImage(path: string): Promise<void> {
  if (!path) return
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path])
  if (error) console.error('[squad:removeImage]', error)
}
