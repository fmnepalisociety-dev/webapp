
export async function getMembers() {
  const { $supabase } = useNuxtApp()

  const { data, error } = await $supabase
  .from('members')
  .select('id, firstname, lastname, email, phone, address')

  if (error) {
    console.error(error)
    return []
  }

  return data
}
