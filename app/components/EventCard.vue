<template>
  <section class="event-card">
    <!-- Top: Heading + Meta + Actions -->
    <div class="event-top">
      <h2 class="event-heading">
        <NuxtLink :to="`/events/${event.id}`" class="event-heading-link">
          {{ event.heading }}
        </NuxtLink>
      </h2>

      <div class="event-details">
        <span class="detail-chip">
          <font-awesome-icon :icon="['fas', 'calendar-days']" />
          {{ event.event_date }}
        </span>
        <span class="detail-chip">
          <font-awesome-icon :icon="['fas', 'clock']" />
          {{ event.event_time }}
        </span>
        <span class="detail-chip">
          <font-awesome-icon :icon="['fas', 'location-dot']" />
          <a
            v-if="locationUrl"
            :href="locationUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="location-link"
          >{{ locationText }}</a>
          <span v-else>{{ locationText }}</span>
        </span>
      </div>

      <!-- Actions: Info + RSVP -->
      <div v-if="hasRsvp || hasInfo" class="actions-row">
        <NuxtLink v-if="hasInfo" :to="`/events/${event.id}/info`" class="btn btn-outline-blue">
          <font-awesome-icon :icon="['fas', 'circle-info']" />
          Event Info
        </NuxtLink>
        <template v-if="hasRsvp && rsvpOpen">
          <NuxtLink :to="`/events/${event.id}/rsvp`" class="btn btn-blue">
            <font-awesome-icon :icon="['fas', 'circle-check']" />
            RSVP
          </NuxtLink>
        </template>
        <template v-else-if="hasRsvp && !rsvpOpen">
          <NuxtLink :to="`/events/${event.id}/rsvp`" class="rsvp-closed-badge">
            Sorry, RSVP has ended
            <span class="rsvp-closed-more">More Info</span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Bottom: Image + Body side by side -->
    <div class="event-bottom" :class="{ 'landscape-layout': isLandscape }">
      <div v-if="imageUrl" class="event-image-col">
        <div class="event-thumb" @click="lightboxOpen = true">
          <img :src="imageUrl" alt="Event Image" @load="onImageLoad" />
          <div class="expand-hint">
            <font-awesome-icon :icon="['fas', 'expand']" />
            <span>View</span>
          </div>
        </div>
      </div>

      <div class="event-content">
        <div v-if="event.body" class="event-body-wrap">
          <div
            ref="bodyEl"
            class="event-body"
            :class="{ collapsed: !bodyExpanded && bodyOverflows }"
            v-html="event.body"
          ></div>
          <button v-if="bodyOverflows" class="expand-toggle" @click="bodyExpanded = !bodyExpanded">
            {{ bodyExpanded ? 'Show less' : 'Read more' }}
            <font-awesome-icon :icon="['fas', bodyExpanded ? 'chevron-up' : 'chevron-down']" />
          </button>
        </div>

        <p v-if="event.promo" v-html="event.promo" class="event-promo"></p>

        <!-- QR code alongside body on desktop -->
        <div v-if="hasRsvp && rsvpOpen" class="rsvp-qr" ref="qrContainer">
          <QrCode :value="rsvpUrl" :size="88" />
          <span class="rsvp-qr-label">Scan to RSVP</span>
          <button class="rsvp-qr-download" title="Download QR code" @click="downloadQr">
            <font-awesome-icon :icon="['fas', 'download']" /> Save QR
          </button>
        </div>
      </div>
    </div>

    <!-- Videos (detail view only) -->
    <div v-if="expanded && videos.length" class="event-videos">
      <h3 class="videos-heading">Videos</h3>
      <div class="videos-grid">
        <div v-for="(video, i) in videos" :key="i" class="video-embed">
          <iframe
            v-if="video.type === 'youtube' && youtubeId(video.src)"
            :src="`https://www.youtube-nocookie.com/embed/${youtubeId(video.src)}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxOpen" class="lightbox-overlay" @click="lightboxOpen = false">
          <button class="lightbox-close" @click="lightboxOpen = false">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
          <img :src="imageUrl!" alt="Event Image" class="lightbox-img" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { isRsvpOpen, type RsvpConfig } from '~/composables/useRsvp';

const props = defineProps<{
  event: {
    id: string;
    heading: string;
    body?: string;
    event_date: string;
    event_time: string;
    event_location: string;
    promo?: string;
    image?: string;
    rsvp?: RsvpConfig | null;
    event_info?: any[] | null;
    videos?: { type: string; src: string }[] | null;
  };
  expanded?: boolean;
}>();

const { getPublicImageUrl } = useSupabaseImage();
import { NeSFM_GENERIC_BUCKET } from '~/composables/useSupabaseImage';

const qrContainer = ref<HTMLElement | null>(null);
const lightboxOpen = ref(false);
const bodyEl = ref<HTMLElement | null>(null);
const bodyExpanded = ref(props.expanded ?? false);
const bodyOverflows = ref(false);
const isLandscape = ref(false);

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  isLandscape.value = img.naturalWidth > img.naturalHeight;
}

const COLLAPSED_HEIGHT = 72; // ~4.5 lines

onMounted(async () => {
  await nextTick();
  if (bodyEl.value) {
    bodyOverflows.value = bodyEl.value.scrollHeight > COLLAPSED_HEIGHT;
  }
});

const hasRsvp = computed(() => !!props.event.rsvp);
const rsvpOpen = computed(() => isRsvpOpen(props.event.rsvp));
const hasInfo = computed(() => !!props.event.event_info?.length);

const imageUrl = computed(() =>
  props.event.image ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, props.event.image) : null
);

const rsvpUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/events/${props.event.id}/rsvp`;
});

function downloadQr() {
  const svg = qrContainer.value?.querySelector('svg');
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('width', '1024');
  clone.setAttribute('height', '1024');

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    URL.revokeObjectURL(url);
    Object.assign(document.createElement('a'), {
      download: `rsvp-qr-${props.event.id}.png`,
      href: canvas.toDataURL('image/png'),
    }).click();
  };
  img.src = url;
}

const locationText = computed(() => {
  if (!props.event.event_location) return '';
  const match = props.event.event_location.match(/^(.*?)\s*\[(.+)]$/);
  return match ? match[1].trim() : props.event.event_location;
});

const locationUrl = computed(() => {
  if (!props.event.event_location) return null;
  const match = props.event.event_location.match(/^(.*?)\s*\[(.+)]$/);
  return match ? match[2].trim() : null;
});

const videos = computed(() => props.event.videos ?? []);

function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/) ?? null;
  return m ? m[1] : null;
}
</script>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ========== Top: Heading + Meta + Actions ========== */
.event-top {
  margin-bottom: 1rem;
}

.event-heading {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.event-heading-link {
  color: inherit;
  text-decoration: none;
}

.event-heading-link:hover {
  text-decoration: underline;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
}

.detail-chip svg {
  color: #2563eb;
  font-size: 0.72rem;
}

.location-link {
  color: #2563eb;
  text-decoration: none;
}

.location-link:hover {
  text-decoration: underline;
}

/* Actions row */
.actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

/* ========== Bottom: Image + Body ========== */
.event-bottom {
  display: flex;
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.event-image-col {
  flex-shrink: 0;
}

.event-thumb {
  position: relative;
  width: 180px;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
}

.event-thumb img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.3s ease;
}

.event-thumb:hover img {
  transform: scale(1.04);
}

.expand-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s;
}

.expand-hint svg {
  font-size: 1.1rem;
}

.event-thumb:hover .expand-hint {
  opacity: 1;
}

/* ========== Landscape layout (event photos) ========== */
.event-bottom.landscape-layout {
  flex-direction: column;
}

.landscape-layout .event-thumb {
  width: 100%;
  max-width: 100%;
}

/* ========== Content ========== */
.event-content {
  flex: 1;
  min-width: 0;
}

/* Body with collapse */
.event-body-wrap {
  margin-bottom: 0.5rem;
}

.event-body {
  color: #374151;
  line-height: 1.6;
  font-size: 0.9rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.event-body.collapsed {
  max-height: 72px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
}

.expand-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.expand-toggle:hover {
  text-decoration: underline;
}

.expand-toggle svg {
  font-size: 0.65rem;
}

.event-promo {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-blue {
  background-color: #2563eb;
  color: white;
}

.btn-blue:hover {
  background-color: #1d4ed8;
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);
}

.btn-blue:active {
  transform: translateY(1px);
}

.btn-outline-blue {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.btn-outline-blue:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
}

.rsvp-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.rsvp-qr-label {
  font-size: 0.62rem;
  color: #9ca3af;
}

.rsvp-qr-download {
  font-size: 0.6rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.rsvp-qr-download:hover {
  text-decoration: underline;
}

/* ========== RSVP Closed ========== */
.rsvp-closed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.rsvp-closed-badge:hover {
  background: #fee2e2;
}

.rsvp-closed-more {
  font-size: 0.7rem;
  font-weight: 500;
  color: #2563eb;
}

.rsvp-closed-badge:hover .rsvp-closed-more {
  text-decoration: underline;
}

/* ========== Videos ========== */
.event-videos {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
}

.videos-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
}

.videos-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #000;
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ========== Lightbox ========== */
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

/* Lightbox transition */
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.2s ease;
}

.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}

/* ========== Responsive ========== */
@media (max-width: 700px) {
  .event-card {
    padding: 1rem;
  }

  .event-bottom {
    flex-direction: column;
    gap: 1rem;
  }

  .event-thumb {
    width: 100%;
    max-width: 280px;
  }
}
</style>
