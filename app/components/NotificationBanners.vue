<template>
  <div v-if="visible.length" class="banner-region">
    <div
      v-for="banner in visible"
      :key="banner.id"
      class="notif-banner"
      :class="`notif-banner--${banner.size || 'medium'}`"
      :style="bannerStyle(banner)"
    >
      <div class="notif-inner">
        <div class="notif-content">
          <div v-if="banner.caption" class="notif-caption" v-html="banner.caption"></div>
          <div v-if="banner.caption && banner.text" class="notif-divider"></div>
          <div
            v-if="banner.text"
            :ref="(el) => setTextEl(banner.id, el)"
            class="notif-text"
            :class="{'notif-text--clamped': !expanded[banner.id]}"
            v-html="banner.text"
          ></div>
          <button
            v-if="banner.text && (overflowing[banner.id] || expanded[banner.id])"
            class="notif-toggle"
            @click="toggle(banner.id)"
          >
            {{ expanded[banner.id] ? 'See less' : 'See more' }}
          </button>
          <a
            v-if="banner.link_url"
            :href="banner.link_url"
            class="notif-cta"
            target="_blank"
            rel="noopener"
          >
            {{ banner.link_label || 'Learn more' }}
          </a>
        </div>
        <div
          v-if="banner.image"
          class="notif-image-wrap"
          :style="banner.image_size ? {maxWidth: banner.image_size + 'px', maxHeight: banner.image_size + 'px'} : undefined"
          @click="lightboxSrc = banner.image"
        >
          <img :src="banner.image" :alt="banner.title || ''" class="notif-image" />
          <div class="expand-hint">
            <font-awesome-icon :icon="['fas', 'expand']" />
            <span>View</span>
          </div>
        </div>
      </div>
      <button
        v-if="banner.dismissible"
        class="notif-close"
        aria-label="Dismiss"
        @click="dismiss(banner.id)"
      >
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
    </div>

    <!-- Lightbox overlay (same pattern as EventCard / ProductCard) -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxSrc" class="lightbox-overlay" @click="lightboxSrc = ''">
          <button class="lightbox-close" @click="lightboxSrc = ''">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
          <img :src="lightboxSrc" alt="Banner image" class="lightbox-img" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch} from 'vue';
import {getActiveBanners, type BannerPosition} from '~/composables/useBanners';

const props = defineProps<{position: BannerPosition}>();

const route = useRoute();

// Lightbox (full-screen image viewer), same UX as the rest of the site.
const lightboxSrc = ref('');

// Per-banner inline style: background + optional exact-height override of the
// preset (drives both the min-height and the collapsed body clamp).
function bannerStyle(banner: any) {
  const style: Record<string, string> = {};
  if (banner.bg_color) style.background = banner.bg_color;
  if (banner.height_px) {
    style['--notif-min-height'] = `${banner.height_px}px`;
    style['--notif-clamp'] = `${banner.height_px}px`;
  }
  return style;
}

// Shared across all mounted instances so we fetch once per page load.
const banners = ref<any[]>([]);
const dismissed = ref<string[]>([]);
const loaded = ref(false);
let loadPromise: Promise<void> | null = null;

// Long-text "See more" state — per banner id, local to this instance.
const expanded = reactive<Record<string, boolean>>({});
const overflowing = reactive<Record<string, boolean>>({});
const textEls = new Map<string, HTMLElement>();

function setTextEl(id: string, el: any) {
  if (el) textEls.set(id, el as HTMLElement);
  else textEls.delete(id);
}

function toggle(id: string) {
  expanded[id] = !expanded[id];
}

// A banner's text overflows the collapsed clamp if its full height exceeds the
// clamped height. Measure only while collapsed (clamp applied).
function measureOverflow() {
  for (const [id, el] of textEls) {
    if (expanded[id]) continue;
    overflowing[id] = el.scrollHeight - el.clientHeight > 2;
  }
}

const DISMISS_KEY = 'nsfm_dismissed_banners';

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    dismissed.value = raw ? JSON.parse(raw) : [];
  } catch {
    dismissed.value = [];
  }
}

async function loadBanners() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    banners.value = await getActiveBanners();
    loaded.value = true;
  })();
  return loadPromise;
}

function dismiss(id: string) {
  if (!dismissed.value.includes(id)) {
    dismissed.value = [...dismissed.value, id];
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed.value));
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
}

onMounted(async () => {
  loadDismissed();
  await loadBanners();
  window.addEventListener('resize', measureOverflow);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureOverflow);
});

const visible = computed(() => {
  if (!loaded.value) return [];
  const now = Date.now();
  return banners.value.filter((b) => {
    if (b.position !== props.position) return false;
    if (b.scope === 'home' && route.path !== '/') return false;
    if (b.start_at && new Date(b.start_at).getTime() > now) return false;
    if (b.end_at && new Date(b.end_at).getTime() < now) return false;
    if (b.dismissible && dismissed.value.includes(b.id)) return false;
    return true;
  });
});

// Re-measure overflow whenever the visible set changes (after the DOM updates).
watch(
  visible,
  async () => {
    await nextTick();
    measureOverflow();
  },
  {flush: 'post'}
);
</script>

<style scoped>
.banner-region {
  width: 100%;
}

.notif-banner {
  position: relative;
  width: 100%;
  background: #dc2626;
  color: #fff;
  box-sizing: border-box;
  /* Height preset defaults (medium); overridden by .notif-banner--{size}.
     Font sizes stay constant — only the banner height changes.
     --notif-clamp caps the collapsed body height (before "See more"),
     which is what actually drives the banner's height. */
  --notif-min-height: 110px;
  --notif-clamp: 140px;
  --notif-image-max: 130px;
  --notif-image-max-w: 260px;
}

.notif-banner--xsmall {
  --notif-min-height: 48px;
  --notif-clamp: 48px;
  --notif-image-max: 68px;
  --notif-image-max-w: 130px;
}

.notif-banner--small {
  --notif-min-height: 76px;
  --notif-clamp: 88px;
  --notif-image-max: 96px;
  --notif-image-max-w: 190px;
}

.notif-banner--small-medium {
  --notif-min-height: 92px;
  --notif-clamp: 112px;
  --notif-image-max: 112px;
  --notif-image-max-w: 220px;
}

/* medium = base defaults on .notif-banner (no modifier needed) */

.notif-banner--medium-large {
  --notif-min-height: 150px;
  --notif-clamp: 205px;
  --notif-image-max: 175px;
  --notif-image-max-w: 320px;
}

.notif-banner--large {
  --notif-min-height: 200px;
  --notif-clamp: 280px;
  --notif-image-max: 220px;
  --notif-image-max-w: 380px;
}

.notif-banner--large-xlarge {
  --notif-min-height: 265px;
  --notif-clamp: 385px;
  --notif-image-max: 270px;
  --notif-image-max-w: 450px;
}

.notif-banner--xlarge {
  --notif-min-height: 340px;
  --notif-clamp: 500px;
  --notif-image-max: 320px;
  --notif-image-max-w: 520px;
}

.notif-inner {
  max-width: 1000px;
  min-height: var(--notif-min-height);
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 2.5rem 0.75rem 1.25rem;
}

.notif-image-wrap {
  order: 2; /* keep on the right regardless of source order */
  position: relative;
  flex-shrink: 0;
  align-self: center;
  max-height: var(--notif-image-max);
  max-width: var(--notif-image-max-w);
  cursor: pointer;
  border-radius: 0.5rem;
  overflow: hidden;
}

.notif-image {
  display: block;
  max-height: inherit;
  max-width: 100%;
  width: auto;
  object-fit: contain;
}

.expand-hint {
  position: absolute;
  bottom: 0.4rem;
  right: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.notif-image-wrap:hover .expand-hint {
  opacity: 1;
}

/* Touch devices can't hover — keep the hint visible. */
@media (hover: none) {
  .expand-hint {
    opacity: 1;
  }
}

.notif-content {
  order: 1;
  flex: 1;
  min-width: 0;
}

/* Caption sits on top and acts as the lead / headline. */
.notif-caption {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-wrap: balance;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.notif-caption :deep(p) {
  margin: 0 0 0.25rem;
}

.notif-caption :deep(p:last-child) {
  margin-bottom: 0;
}

.notif-caption :deep(a) {
  color: inherit;
  text-decoration: underline;
}

/* Thin divider between the caption and the body text. */
.notif-divider {
  height: 1px;
  width: 100%;
  max-width: 460px;
  margin: 0.5rem 0 0.6rem;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0.1)
  );
}

/* Text is the (possibly long) body, clamped until "See more" is clicked. */
.notif-text {
  font-size: 0.9rem;
  line-height: 1.45;
}

.notif-text :deep(p) {
  margin: 0 0 0.5rem;
}

.notif-text :deep(p:last-child) {
  margin-bottom: 0;
}

.notif-text :deep(a) {
  color: inherit;
  text-decoration: underline;
}

.notif-text--clamped {
  max-height: var(--notif-clamp);
  overflow: hidden;
}

.notif-toggle {
  display: inline-block;
  margin-top: 0.55rem;
  padding: 0.3rem 0.85rem;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 999px;
  color: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.notif-toggle:hover {
  background: rgba(255, 255, 255, 0.32);
}

.notif-cta {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.35rem 0.9rem;
  background: rgba(255, 255, 255, 0.95);
  color: #b91c1c;
  border-radius: 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}

.notif-cta:hover {
  background: #fff;
}

.notif-close {
  position: absolute;
  top: 0.5rem;
  right: 0.6rem;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.8;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem;
}

.notif-close:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .notif-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
}

/* ===== Lightbox (matches EventCard / ProductCard) ===== */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: default;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 1.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.2s ease;
}

.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
</style>
