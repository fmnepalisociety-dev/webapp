import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage'
import type {RsvpConfig} from '~/composables/useRsvp'

// A product's order form reuses the exact same config shape as an event's RSVP
// form, so the whole form engine (renderer, builder, helpers) is shared.
export type OrderFormConfig = RsvpConfig

// Backdrop shown behind product images. A medium neutral gray so that BOTH
// white and black garments keep clear edge contrast (light bgs hide white
// shirts, dark bgs hide black ones). Admins can override it per product.
export const DEFAULT_PRODUCT_BG = '#8b9199'

export async function getProducts() {
  const {$supabase} = useNuxtApp()

  const {data, error} = await $supabase
    .from('products')
    .select('*')
    .order('sort_order', {ascending: true, nullsFirst: false})
    .order('created_at', {ascending: false})

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Fetch a single product by its UUID id or its slug.
export async function getProduct(idOrSlug: string) {
  const {$supabase} = useNuxtApp()
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug'
  const {data, error} = await $supabase.from('products').select('*').eq(column, idOrSlug).single()
  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  return data
}

// Preferred public path for a product: slug when set, else the UUID.
export function productPath(product: {id: string; slug?: string | null}): string {
  return `/shop/${product.slug || product.id}`
}

// Turn a name into a URL-friendly slug.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Only the active products, for public listing
export async function getActiveProducts() {
  const all = await getProducts()
  return all.filter((p: any) => p.active)
}

/* -----------------------------
 * Admin CRUD
 * --------------------------- */

export interface ProductVideo {
  type: string
  src: string
}

// Core product fields the admin editor manages (order_form is edited on its own screen)
export interface ProductInput {
  name: string
  slug: string | null
  description: string | null
  promo: string | null
  price: number | null
  image: string[] | null
  image_bg: string | null
  featured: boolean
  active: boolean
  videos: ProductVideo[] | null
}

// Create a product; the DB auto-generates the id. Returns the new id (or null on failure).
export async function createProduct(
  input: ProductInput
): Promise<{id: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {data, error} = await $supabase.from('products').insert(input).select('id').single()
  if (error) console.error('[products:create]', error)
  return {id: (data as any)?.id ?? null, error}
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('products').update(input).eq('id', id)
  if (error) console.error('[products:update]', error)
  return {error}
}

// Persist just the order form config for a product (leaves other columns untouched).
export async function updateProductOrderForm(
  id: string,
  order_form: unknown
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('products').update({order_form}).eq('id', id)
  if (error) console.error('[products:updateOrderForm]', error)
  return {error}
}

export async function deleteProduct(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('products').delete().eq('id', id)
  if (error) console.error('[products:delete]', error)
  return {error}
}

// Upload a product image to `products/<timestamp>-<name>`; returns its storage
// path. Timestamp-prefixed so uploads work before a new product has an id and
// so re-using the same filename across products never collides.
export async function uploadProductImage(
  file: File
): Promise<{path: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `products/${Date.now()}-${safeName}`

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false})

  if (error) {
    console.error('[products:upload]', error)
    return {path: null, error}
  }
  return {path, error: null}
}

export async function deleteProductImage(path: string): Promise<void> {
  if (!path) return
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.storage.from(NeSFM_GENERIC_BUCKET).remove([path])
  if (error) console.error('[products:removeImage]', error)
}

// Admin: update an order's fulfillment status / internal note.
export async function updateProductOrder(
  id: string,
  patch: {status?: string; admin_note?: string}
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp()
  const {error} = await $supabase.from('product_orders').update(patch).eq('id', id)
  if (error) console.error('[orders:update]', error)
  return {error}
}

// Record a new order for a product.
export async function submitOrder(productId: string, responses: Record<string, unknown>) {
  const {$supabase} = useNuxtApp()

  const {error} = await $supabase.from('product_orders').insert({
    product_id: productId,
    responses,
  })

  if (error) {
    console.error('[submitOrder]', error)
    throw new Error('Failed to submit your order. Please try again.')
  }
}
