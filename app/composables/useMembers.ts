import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage'

export async function getMembers() {
  const {$supabase} = useNuxtApp()

  const {data, error} = await $supabase
  .from('members')
  .select('id, firstname, lastname, membership_id, expiry_date')
  .order('id', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data
}

/* -----------------------------
 * Admin
 * --------------------------- */

// Full record the admin manager edits. `membership_id` is the human-facing
// ID (e.g. NeSFM-0001); `id` is the numeric primary key.
export interface AdminMember {
  id: number
  firstname: string
  lastname: string
  email: string | null
  phone: string | null
  membership_id: string | null
  membership_type: string | null
  expiry_date: string | null
  image_path: string | null
}

export type MemberInput = Omit<AdminMember, 'id'>

const MEMBER_COLUMNS =
  'id, firstname, lastname, email, phone, membership_id, membership_type, expiry_date, image_path'

export async function getAdminMembers(): Promise<AdminMember[]> {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase
    .from('members')
    .select(MEMBER_COLUMNS)
    .order('id', {ascending: true})
  if (error) {
    console.error('[members:getAll]', error)
    return []
  }
  return (data as AdminMember[]) ?? []
}

// The members table's `id` PK has no DB default, so we compute the next id
// ourselves (max + 1). On a rare race (duplicate PK, code 23505) we retry once.
export async function createMember(input: MemberInput): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()

  const nextId = async () => {
    const {data} = await $supabase
      .from('members')
      .select('id')
      .order('id', {ascending: false})
      .limit(1)
    return (((data?.[0] as {id: number} | undefined)?.id ?? 0) as number) + 1
  }

  let {error} = await $supabase.from('members').insert({id: await nextId(), ...input})
  if ((error as any)?.code === '23505') {
    ;({error} = await $supabase.from('members').insert({id: await nextId(), ...input}))
  }
  if (error) console.error('[members:create]', error)
  return {error}
}

export async function updateMember(
  id: number,
  input: Partial<MemberInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('members').update(input).eq('id', id)
  if (error) console.error('[members:update]', error)
  return {error}
}

export async function deleteMember(id: number): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('members').delete().eq('id', id)
  if (error) console.error('[members:delete]', error)
  return {error}
}

// Upload a member photo to `members/<prefix><name>`; returns its storage path.
export async function uploadMemberImage(
  file: File,
  prefix = ''
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const cleanPrefix = prefix ? `${prefix.replace(/[^a-zA-Z0-9.-]/g, '_')}-` : ''
  const path = `members/${cleanPrefix}${safeName}`

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false})

  if (error) {
    console.error('[members:upload]', error)
    return {path: null, error}
  }
  return {path, error: null}
}

export async function deleteMemberImage(path: string): Promise<void> {
  if (!path) return
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path])
  if (error) console.error('[members:removeImage]', error)
}
