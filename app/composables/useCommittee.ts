export async function getCommittee() {
  const {$supabase} = useNuxtApp()

  // Fetch committee entries with member info
  const {data, error} = await $supabase
  .from('committee')
  .select(`
      id,
      display_name,
      role,
      image_path,
      member_id,
      members:members(id, firstname, lastname, email, phone)
    `);

  if (error) {
    console.error('Error fetching committee:', error)
    return []
  }

  return data
}