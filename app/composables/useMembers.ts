export async function getMembers() {
  const {$supabase} = useNuxtApp()

  const {data, error} = await $supabase
  .from('members')
  .select('id, firstname, lastname, membership_id')
  .order('id', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data
}
