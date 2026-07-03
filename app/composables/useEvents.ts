import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage'

export async function getEvents() {
  const {$supabase} = useNuxtApp()

  // Fetch all events, sorted by date ascending
  const {data, error} = await $supabase
  .from('events')
  .select('*')
  .order('event_date', {ascending: true})

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data
}

// Fetch a single event by id
export async function getEvent(id: string) {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase.from('events').select('*').eq('id', id).single()
  if (error) {
    console.error('Error fetching event:', error)
    return null
  }
  return data
}

// Helper composable to get upcoming events
export async function getUpcomingEvents() {
  const allEvents = await getEvents()
  const today = new Date()
  return allEvents.filter((e: any) => new Date(e.event_date) >= today)
}

// Helper composable to get past events
export async function getPastEvents() {
  const allEvents = await getEvents()
  const today = new Date()
  return allEvents
    .filter((e: any) => new Date(e.event_date) < today)
    .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
}

/* -----------------------------
 * Admin CRUD
 * --------------------------- */

export interface EventVideo {
  type: string
  src: string
}

// Core event fields the admin editor manages (event_info & rsvp are edited on their own screens)
export interface EventInput {
  heading: string
  event_date: string
  event_time: string
  event_location: string
  body: string | null
  promo: string | null
  image: string[] | null
  featured: boolean
  videos: EventVideo[] | null
}

// Create an event; the DB auto-generates the id. Returns the new id (or null on failure).
export async function createEvent(input: EventInput): Promise<{id: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase.from('events').insert(input).select('id').single()
  if (error) console.error('[events:create]', error)
  return {id: (data as any)?.id ?? null, error}
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('events').update(input).eq('id', id)
  if (error) console.error('[events:update]', error)
  return {error}
}

// Persist just the RSVP config for an event (leaves other columns untouched).
export async function updateEventRsvp(id: string, rsvp: unknown): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('events').update({rsvp}).eq('id', id)
  if (error) console.error('[events:updateRsvp]', error)
  return {error}
}

export async function deleteEvent(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('events').delete().eq('id', id)
  if (error) console.error('[events:delete]', error)
  return {error}
}

// Upload an event image to `events/<year>/<name>`; returns its storage path.
export async function uploadEventImage(
  file: File,
  year: number
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `events/${year}/${safeName}`

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false})

  if (error) {
    console.error('[events:upload]', error)
    return {path: null, error}
  }
  return {path, error: null}
}

export async function deleteEventImage(path: string): Promise<void> {
  if (!path) return
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path])
  if (error) console.error('[events:removeImage]', error)
}
