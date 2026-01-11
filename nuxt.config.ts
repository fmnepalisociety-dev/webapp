
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const BASE = isGitHubPages ? '/webapp/' : '/'

export default defineNuxtConfig({
  typescript: {
    // typeCheck: true, // turn this on once we've burned down issues (so builds don't fail)
    strict: true,
  },

  ssr: false,

  devtools: { enabled: true, timeline: { enabled: true } },

  css: ['~/assets/main.css'],
  ssr: false,

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  app: {
    baseURL: BASE,
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'Nepali Society of Fargo-Moorhead',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: BASE + '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: BASE + '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: BASE + '/favicon.png' },
        { rel: 'manifest', href: BASE + '/site.webmanifest' },
      ],
    },
  },


  nitro: {preset: 'github-pages',},
})
