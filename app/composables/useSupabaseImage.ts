export const NeSFM_GENERIC_BUCKET = 'nsfm'

/**
 * Upload an image to the public bucket under a folder and return its public URL.
 * Used by admin editors (e.g. the RSVP image field) that store a URL, not a path.
 */
export async function uploadPublicImage(
  file: File,
  folder = 'uploads'
): Promise<{url: string | null; error: unknown}> {
  const {$supabase} = useNuxtApp()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`

  const {error} = await $supabase.storage
    .from(NeSFM_GENERIC_BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false})
  if (error) {
    console.error('[uploadPublicImage]', error)
    return {url: null, error}
  }

  const {data} = $supabase.storage.from(NeSFM_GENERIC_BUCKET).getPublicUrl(path)
  return {url: data?.publicUrl ?? null, error: null}
}

type GetImageUrlOptions = {
  bucket: string
  path: string
  isPublic?: boolean
  expiresIn?: number
}

const DEFAULT_EXPIRES_IN = 60 * 60 // 1 hour

export const useSupabaseImage = () => {
  const {$supabase} = useNuxtApp()

  /* -----------------------------
   * Public image helper
   * --------------------------- */
  const getPublicImageUrl = (bucket: string, path: string): string | null => {
    if (!path) return null

    return (
      $supabase
      .storage
      .from(bucket)
      .getPublicUrl(path)
        .data
        .publicUrl ?? null
    )
  }

  /* -----------------------------
   * Private image helper
   * --------------------------- */
  const getPrivateImageUrl = async (
    bucket: string,
    path: string,
    expiresIn: number
  ): Promise<string | null> => {
    if (!path) return null

    const {data, error} = await $supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[Supabase Image Error]', error)
      return null
    }

    return data?.signedUrl ?? null
  }

  /* -----------------------------
   * Unified API
   * --------------------------- */
  const getImageUrl = async ({
                               bucket,
                               path,
                               isPublic = false,
                               expiresIn = DEFAULT_EXPIRES_IN,
                             }: GetImageUrlOptions): Promise<string | null> => {
    if (!path) return null

    return isPublic
      ? getPublicImageUrl(bucket, path)
      : await getPrivateImageUrl(bucket, path, expiresIn)
  }

  return {
    getImageUrl,
    getPublicImageUrl,
    getPrivateImageUrl,
  }
}
