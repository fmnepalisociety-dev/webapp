<template>
  <section class="event-info">
    <h2 class="text-2xl font-bold text-gray-800">
      <NuxtLink :to="`/events/${event.id}`" class="event-heading-link">{{ event.heading }}</NuxtLink>
    </h2>

    <div v-if="showRsvp" class="rsvp-row">
      <NuxtLink
        :to="`/events/${event.id}/rsvp`"
        class="btn btn-blue"
      >
        <font-awesome-icon :icon="['fas', 'circle-check']" />
        RSVP for this event
      </NuxtLink>
      <div class="rsvp-qr" ref="qrContainer">
        <QrCode :value="rsvpUrl" :size="96" />
        <span class="rsvp-qr-label">Scan to RSVP</span>
        <button class="rsvp-qr-download" title="Download QR code" @click="downloadQr">
          <font-awesome-icon :icon="['fas', 'download']" /> Save QR
        </button>
      </div>
    </div>

    <p v-html="event.body" class="text-gray-700 leading-relaxed"></p>

    <table class="detail-table">
      <tbody>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'calendar-days']" class="text-blue-500" />
          </td>
          <td class="detail-label">Date</td>
          <td class="detail-value">{{ event.event_date }}</td>
        </tr>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'clock']" class="text-blue-500" />
          </td>
          <td class="detail-label">Time</td>
          <td class="detail-value font-semibold">{{ event.event_time }}</td>
        </tr>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'location-dot']" class="text-blue-500" />
          </td>
          <td class="detail-label">Location</td>
          <td class="detail-value">
            <a
              v-if="locationUrl"
              :href="locationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline"
            >
              {{ locationText }}
            </a>
            <span v-else>{{ locationText }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="event.promo" v-html="event.promo" class="text-gray-600"></p>

    <ZoomImage v-if="event.image_path" :src="event.image_path" alt="Event Image" class="mt-4" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isRsvpOpen, type RsvpConfig } from '~/composables/useRsvp';

const qrContainer = ref<HTMLElement | null>(null);

const props = defineProps<{
  event: {
    id: string;
    heading: string;
    body?: string;
    event_date: string;
    event_time: string;
    event_location: string;
    promo?: string;
    image_path?: string;
    rsvp?: RsvpConfig | null;
  };
}>();

const showRsvp = computed(() => isRsvpOpen(props.event.rsvp));

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
.detail-table {
  border-collapse: separate;
  border-spacing: 0.75rem 0.4rem;
  margin-left: -0.75rem;
  width: auto;
}

.detail-table td {
  vertical-align: middle;
}

.detail-icon {
  width: 1.25rem;
  text-align: center;
}

.detail-label {
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
}

.detail-value {
  color: #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.btn-blue {
  background-color: #2563eb;
  color: white;
}

.btn-blue:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-blue:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rsvp-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

.rsvp-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.rsvp-qr-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-align: center;
}

.rsvp-qr-download {
  font-size: 0.65rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.rsvp-qr-download:hover {
  text-decoration: underline;
}

.event-heading-link {
  color: inherit;
  text-decoration: none;
}

.event-heading-link:hover {
  text-decoration: underline;
}
</style>
