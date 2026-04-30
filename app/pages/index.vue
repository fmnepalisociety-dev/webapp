<template>
  <div class="about-page">

    <div v-for="flyer in flyers" :key="flyer.id" class="image-section">
      <div
        class="flyer-wrap"
        :class="{ 'has-event': flyerEvent(flyer), 'overlay-visible': activeFlyerId === flyer.id }"
        @click="handleFlyerTap(flyer)"
      >
        <ZoomImage
          v-if="flyerImages[flyer.id]"
          :src="flyerImages[flyer.id]"
          :alt="flyer.title"
          img-class="event-image"
        />

        <div v-if="flyerEvent(flyer)" class="flyer-event-overlay">
          <button class="flyer-overlay-close" @click.stop="activeFlyerId = null">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
          <div class="flyer-event-info">
            <h3 class="flyer-event-heading">{{ flyerEvent(flyer)!.heading }}</h3>
            <div class="flyer-event-chips">
              <span class="flyer-chip">
                <font-awesome-icon :icon="['fas', 'calendar-days']" />
                {{ flyerEvent(flyer)!.event_date }}
              </span>
              <span class="flyer-chip">
                <font-awesome-icon :icon="['fas', 'clock']" />
                {{ flyerEvent(flyer)!.event_time }}
              </span>
              <span class="flyer-chip">
                <font-awesome-icon :icon="['fas', 'location-dot']" />
                {{ locationText(flyerEvent(flyer)!.event_location) }}
              </span>
            </div>
            <p
              v-if="flyerEvent(flyer)!.body"
              class="flyer-event-body"
              v-html="flyerEvent(flyer)!.body"
            ></p>
            <span class="flyer-event-cta">
              View Event Details
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </span>
          </div>
        </div>
      </div>
      <p v-if="flyer.caption" class="image-caption">{{ flyer.caption }}</p>
    </div>

    <div class="intro">
      <p>
        We are a community-based, non-profit organization dedicated to bringing together the Nepali community in the
        Fargo–Moorhead area. Our mission is to celebrate Nepali culture, language, and traditions, while fostering
        meaningful connections within the broader local community.
      </p>
    </div>

    <div v-for="fe in featuredEvents" :key="fe.id" class="image-section">
      <ZoomImage
        :src="getPublicImageUrl('nsfm', fe.image)"
        img-class="event-image"
        :alt="fe.heading"
      />
      <p class="image-caption">{{ fe.heading }}</p>
      <NuxtLink :to="`/events/${fe.id}`" class="caption-link">
        View Details
        <font-awesome-icon :icon="['fas', 'arrow-right']" />
      </NuxtLink>
    </div>

    <div class="details">
      <p>
        Join us as we continue to strengthen our community, share our culture, and build meaningful relationships with
        neighbors, friends, and the wider Fargo-Moorhead community.
      </p>
    </div>

    <OfficialBanner />
  </div>
</template>

<script setup lang="ts">
import {getActiveFlyers} from '~/composables/useFlyers';
import {getEvents} from '~/composables/useEvents';
import type {Flyer, TimeboundMeta} from '~/types/flyer';

const {getPublicImageUrl} = useSupabaseImage();

const flyers = ref<Flyer[]>([]);
const flyerImages = ref<Record<number, string | null>>({});
const events = ref<any[]>([]);

onMounted(async () => {
  const [fetchedFlyers, fetchedEvents] = await Promise.all([
    getActiveFlyers(),
    getEvents(),
  ]);
  flyers.value = fetchedFlyers;
  events.value = fetchedEvents;
  for (const flyer of flyers.value) {
    flyerImages.value[flyer.id] = getPublicImageUrl('nsfm', flyer.image_path);
  }
});

function flyerEvent(flyer: Flyer) {
  const meta = flyer.metadata as TimeboundMeta | null;
  if (!meta?.event_id) return null;
  return events.value.find((e: any) => e.id === meta.event_id) ?? null;
}

function locationText(location: string) {
  if (!location) return '';
  const match = location.match(/^(.*?)\s*\[(.+)]$/);
  return match ? match[1].trim() : location;
}

const featuredEvents = computed(() => {
  return [...events.value]
    .filter((e: any) => e.featured && e.image)
    .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
});

const activeFlyerId = ref<number | null>(null);

function handleFlyerTap(flyer: Flyer) {
  const evt = flyerEvent(flyer);
  if (!evt) return;

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    // Mobile: first tap shows overlay, second tap navigates
    if (activeFlyerId.value === flyer.id) {
      activeFlyerId.value = null;
      navigateTo(`/events/${evt.id}`);
    } else {
      activeFlyerId.value = flyer.id;
    }
  } else {
    // Desktop: click navigates (overlay already visible via hover)
    navigateTo(`/events/${evt.id}`);
  }
}
</script>

<style scoped>
.about-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.intro h2 {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3498db;
  display: inline-block;
  padding-bottom: 0.25rem;
}

.intro p {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.details p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

/* Flyer with event overlay */
.flyer-wrap {
  position: relative;
  border-radius: 25px;
  overflow: hidden;
}

.flyer-wrap.has-event {
  cursor: pointer;
}

.flyer-event-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.flyer-wrap.has-event:hover .flyer-event-overlay,
.flyer-wrap.overlay-visible .flyer-event-overlay {
  opacity: 1;
}

.flyer-overlay-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  transition: background 0.2s;
}

.flyer-overlay-close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.flyer-event-info {
  max-width: 600px;
  max-height: 80%;
  width: 90%;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: center;
  align-items: center;
  overflow: hidden;
}

.flyer-event-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}

.flyer-event-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.flyer-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.3rem 0.7rem;
  border-radius: 1rem;
}

.flyer-chip svg {
  font-size: 0.7rem;
  opacity: 0.8;
}

.flyer-event-body {
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  opacity: 0.9;
  white-space: pre-wrap;
  word-break: break-word;
  flex-shrink: 1;
  min-height: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 65%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 65%, transparent 100%);
}

.flyer-event-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 0.25rem;
  color: #93c5fd;
  background: rgba(37, 99, 235, 0.2);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  transition: background 0.2s;
  flex-shrink: 0;
}

.flyer-wrap.has-event:hover .flyer-event-cta:hover,
.flyer-wrap.overlay-visible .flyer-event-cta {
  background: rgba(37, 99, 235, 0.4);
}

.flyer-event-cta svg {
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.flyer-wrap.has-event:hover .flyer-event-cta svg,
.flyer-wrap.overlay-visible .flyer-event-cta svg {
  transform: translateX(3px);
}
</style>
