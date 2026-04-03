<template>
  <section class="event-card">
    <!-- Col 1: Image thumbnail -->
    <div v-if="imageUrl" class="event-image-col">
      <div class="event-thumb" @click="lightboxOpen = true">
        <img :src="imageUrl" alt="Event Image" />
        <div class="expand-hint">
          <font-awesome-icon :icon="['fas', 'expand']" />
          <span>View</span>
        </div>
      </div>
    </div>

    <!-- Col 2: Content -->
    <div class="event-content">
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
    </div>

    <!-- Col 3: RSVP -->
    <div v-if="showRsvp" class="rsvp-col">
      <NuxtLink :to="`/events/${event.id}/rsvp`" class="btn btn-blue">
        <font-awesome-icon :icon="['fas', 'circle-check']" />
        RSVP
      </NuxtLink>
      <div class="rsvp-qr" ref="qrContainer">
        <QrCode :value="rsvpUrl" :size="88" />
        <span class="rsvp-qr-label">Scan to RSVP</span>
        <button class="rsvp-qr-download" title="Download QR code" @click="downloadQr">
          <font-awesome-icon :icon="['fas', 'download']" /> Save QR
        </button>
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

const { getPublicImageUrl } = useSupabaseImage();

const qrContainer = ref<HTMLElement | null>(null);
const lightboxOpen = ref(false);
const bodyEl = ref<HTMLElement | null>(null);
const bodyExpanded = ref(false);
const bodyOverflows = ref(false);

const COLLAPSED_HEIGHT = 72; // ~4.5 lines

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
  };
}>();

onMounted(async () => {
  await nextTick();
  if (bodyEl.value) {
    bodyOverflows.value = bodyEl.value.scrollHeight > COLLAPSED_HEIGHT;
  }
});

const showRsvp = computed(() => isRsvpOpen(props.event.rsvp));

const imageUrl = computed(() =>
  props.event.image ? getPublicImageUrl('nsfm', props.event.image) : null
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
</script>

<style scoped>
.event-card {
  display: flex;
  gap: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ========== Col 1: Image ========== */
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

/* ========== Col 2: Content ========== */
.event-content {
  flex: 1;
  min-width: 0;
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
  margin-bottom: 0.65rem;
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

/* Body with collapse */
.event-body-wrap {
  margin-bottom: 0.5rem;
}

.event-body {
  color: #374151;
  line-height: 1.6;
  font-size: 0.9rem;
  margin: 0;
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

/* ========== Col 3: RSVP ========== */
.rsvp-col {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-left: 1.25rem;
  border-left: 1px solid #f0f0f0;
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
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .event-thumb {
    width: 100%;
    max-width: 280px;
  }

  .rsvp-col {
    flex-direction: row;
    border-left: none;
    border-top: 1px solid #f0f0f0;
    padding-left: 0;
    padding-top: 0.75rem;
    gap: 1rem;
  }
}
</style>
