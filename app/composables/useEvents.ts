import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage'
import {nextSession} from '~/composables/useRecurrence'
import type {RecurrenceFreq} from '~/types/recurrence'

/**
 * Extensible per-event data held in the `events.meta` jsonb column. New optional
 * attributes go here rather than as new columns, so most future changes need no
 * database migration.
 */
export interface EventRecurrence {
  freq: RecurrenceFreq // 'weekly' | 'biweekly' | 'monthly'
  start_date: string // YYYY-MM-DD anchor
  cancelled_dates?: string[] // YYYY-MM-DD sessions to skip
}

export interface EventMeta {
  category?: string // e.g. 'education'; absent = general event
  recurrence?: EventRecurrence | null
}

export const eventMeta = (e: any): EventMeta => (e?.meta ?? {}) as EventMeta
export const eventRecurrence = (e: any): EventRecurrence | null => eventMeta(e).recurrence ?? null
export const eventCategory = (e: any): string => eventMeta(e).category ?? ''

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

// One-off (non-recurring) upcoming events. Recurring events live in their own bucket.
export async function getUpcomingEvents() {
  const allEvents = await getEvents()
  const today = new Date()
  return allEvents.filter((e: any) => !eventRecurrence(e) && new Date(e.event_date) >= today)
}

// One-off (non-recurring) past events.
export async function getPastEvents() {
  const allEvents = await getEvents()
  const today = new Date()
  return allEvents
    .filter((e: any) => !eventRecurrence(e) && new Date(e.event_date) < today)
    .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
}

// Recurring events, sorted by their next upcoming (non-cancelled) session.
export async function getRecurringEvents() {
  const allEvents = await getEvents()
  return allEvents
    .filter((e: any) => !!eventRecurrence(e))
    .sort((a: any, b: any) => {
      const ra = eventRecurrence(a)!
      const rb = eventRecurrence(b)!
      const na = nextSession(ra.start_date, ra.freq, ra.cancelled_dates ?? [])
      const nb = nextSession(rb.start_date, rb.freq, rb.cancelled_dates ?? [])
      return (na ? na.date.getTime() : Infinity) - (nb ? nb.date.getTime() : Infinity)
    })
}

// Events tagged with a given category (e.g. 'education').
export async function getEventsByCategory(category: string) {
  const allEvents = await getEvents()
  return allEvents.filter((e: any) => eventCategory(e) === category)
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
  // Optional link to a tournament (by its key) whose squads render on the event
  // page. Requires the `tournament_key` column on the `events` table.
  tournament_key: string | null
  // Extensible attributes (category, recurrence, …) in the `meta` jsonb column.
  meta: EventMeta
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
