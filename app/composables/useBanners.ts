/* -----------------------------
 * Notification banners
 * Admin-controlled announcement banners (e.g. fundraiser calls-to-action)
 * shown on the public site. Mirrors the useEvents CRUD pattern.
 * --------------------------- */

export type BannerPosition = 'page_top' | 'above_nav' | 'below_nav'
export type BannerScope = 'all' | 'home'
export type BannerSize =
  | 'xsmall'
  | 'small'
  | 'small-medium'
  | 'medium'
  | 'medium-large'
  | 'large'
  | 'large-xlarge'
  | 'xlarge'

export interface BannerInput {
  title: string // internal admin label
  text: string | null // headline / body HTML
  caption: string | null // secondary caption HTML
  image: string | null // public image URL (optional)
  image_size: number | null // max image size in px (blank = scale with height)
  link_url: string | null // optional CTA link
  link_label: string | null // optional CTA button label
  position: BannerPosition
  scope: BannerScope
  size: BannerSize // banner height preset (quick starting point)
  height_px: number | null // optional exact height in px; overrides the preset
  bg_color: string | null // optional background hex
  dismissible: boolean
  active: boolean
  start_at: string | null // ISO timestamp; show only after this time
  end_at: string | null // ISO timestamp; hide after this time
  sort_order: number
}

// Fetch all banners for the admin list (newest sort_order first is handled in-page).
export async function getBanners() {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase
    .from('banners')
    .select('*')
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: false})
  if (error) {
    console.error('Error fetching banners:', error)
    return []
  }
  return data
}

// Fetch a single banner by id.
export async function getBanner(id: string) {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase.from('banners').select('*').eq('id', id).single()
  if (error) {
    console.error('Error fetching banner:', error)
    return null
  }
  return data
}

// Public: fetch active banners. Time-window filtering happens client-side
// (the site is client-rendered only, so "now" is the visitor's clock).
export async function getActiveBanners() {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', {ascending: true})
  if (error) {
    console.error('Error fetching active banners:', error)
    return []
  }
  return data
}

export async function createBanner(
  input: BannerInput
): Promise<{id: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase.from('banners').insert(input).select('id').single()
  if (error) console.error('[banners:create]', error)
  return {id: (data as any)?.id ?? null, error}
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('banners').update(input).eq('id', id)
  if (error) console.error('[banners:update]', error)
  return {error}
}

export async function deleteBanner(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('banners').delete().eq('id', id)
  if (error) console.error('[banners:delete]', error)
  return {error}
}
