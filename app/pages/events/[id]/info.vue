<template>
  <main class="info-page">
    <div v-if="!event" class="text-center py-12">
      <h1 class="not-found-title">Event Not Found</h1>
      <NuxtLink to="/events" class="back-link">Back to Events</NuxtLink>
    </div>

    <template v-else>
      <div class="back-link-wrapper">
        <NuxtLink :to="`/events/${eventId}`" class="back-link">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Back to Event
        </NuxtLink>
      </div>

      <!-- Event Header -->
      <div class="info-header">
        <h1 class="info-title">{{ event.heading }}</h1>
        <div class="info-meta">
          <span class="meta-chip">
            <font-awesome-icon :icon="['fas', 'calendar-days']" />
            {{ event.event_date }}
          </span>
          <span class="meta-chip">
            <font-awesome-icon :icon="['fas', 'clock']" />
            {{ event.event_time }}
          </span>
          <span class="meta-chip">
            <font-awesome-icon :icon="['fas', 'location-dot']" />
            {{ parseLocation(event.event_location).text }}
          </span>
        </div>
      </div>

      <!-- Table of Contents -->
      <nav v-if="sections.length" class="toc">
        <ul class="toc-list">
          <li v-for="(section, idx) in sections" :key="idx">
            <a :href="`#section-${idx}`" class="toc-link" @click.prevent="scrollToSection(idx)">
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="toc-icon" />
              <span v-html="section.title"></span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- No info available -->
      <div v-if="!sections.length" class="no-info">
        <p>No additional information is available for this event yet.</p>
      </div>

      <!-- Info Sections -->
      <div v-for="(section, idx) in sections" :key="idx" :id="`section-${idx}`" class="info-section">
        <h2 class="section-title" v-html="section.title"></h2>
        <p v-if="section.description" class="section-description" v-html="section.description"></p>

        <!-- list type: items with title, description, detail -->
        <div v-if="section.type === 'list' && section.items?.length" class="section-items">
          <div v-for="(item, i) in section.items" :key="i" class="info-item">
            <h3 v-if="item.title" class="item-title" v-html="item.title"></h3>
            <p v-if="item.description" class="item-description" v-html="item.description"></p>
            <p v-if="item.detail" class="item-detail" v-html="item.detail"></p>
          </div>
        </div>

        <!-- text type: just rendered HTML content -->
        <div v-if="section.type === 'text' && section.content" class="section-text" v-html="section.content"></div>
      </div>

    </template>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getEvents } from '~/composables/useEvents';

const route = useRoute();
const eventId = route.params.id as string;

const allEvents = await getEvents();
const event = ref(allEvents.find((e: any) => e.id === eventId) ?? null);

interface InfoItem {
  title?: string;
  description?: string;
  detail?: string;
}

interface InfoSection {
  type: 'list' | 'text';
  title: string;
  description?: string;
  items?: InfoItem[];
  content?: string;
}

const sections = computed<InfoSection[]>(() => {
  if (!event.value?.event_info) return [];
  return event.value.event_info as InfoSection[];
});

function scrollToSection(idx: number) {
  const el = document.getElementById(`section-${idx}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function parseLocation(loc: string) {
  const match = loc.match(/^(.*?)\s*\[(.+)]$/);
  return { text: match ? match[1].trim() : loc, url: match ? match[2].trim() : null };
}

</script>

<style scoped>
.info-page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.not-found-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1rem;
}

.back-link-wrapper {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  background: #eff6ff;
  transition: all 0.15s;
}

.back-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

/* Header */
.info-header {
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #e5e7eb;
}

.info-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
}

.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.3rem 0.75rem;
  border-radius: 1rem;
}

.meta-chip svg {
  color: #2563eb;
  font-size: 0.75rem;
}

/* Table of Contents */
.toc {
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: #f0f5ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 2rem;
  transition: all 0.15s;
}

.toc-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.toc-icon {
  font-size: 0.6rem;
}

/* No info */
.no-info {
  text-align: center;
  color: #6b7280;
  padding: 2rem 0;
  font-size: 1rem;
}

/* Sections */
.info-section {
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #2563eb;
  display: inline-block;
}

.section-description {
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem;
}

/* List items */
.section-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #2563eb;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e3a5f;
  margin: 0 0 0.25rem;
}

.item-description {
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0 0 0.25rem;
}

.item-detail {
  font-size: 0.82rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

/* Text content */
.section-text {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.7;
}

.section-text :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.section-text :deep(a:hover) {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 640px) {
  .info-page {
    padding: 1rem;
  }

  .info-title {
    font-size: 1.35rem;
  }

  .info-section {
    padding: 1rem;
  }
}
</style>
