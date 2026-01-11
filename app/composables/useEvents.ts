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
  return allEvents.filter((e: any) => new Date(e.event_date) < today)
}
