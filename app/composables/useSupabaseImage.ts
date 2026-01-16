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
