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
        <div class="section-header">
          <h2 class="section-title" v-html="section.title"></h2>
          <p v-if="section.description" class="section-description" v-html="section.description"></p>
        </div>

        <!-- list type: card grid -->
        <div v-if="section.type === 'list' && section.items?.length" class="card-grid">
          <div v-for="(item, i) in section.items" :key="i" class="card" :class="{ 'has-image': extractImage(item.description) }">
            <div v-if="extractImage(item.description)" class="card-image-wrap">
              <img :src="extractImage(item.description)!" :alt="item.title || ''" class="card-image" loading="lazy" />
            </div>
            <div class="card-body">
              <h3 v-if="item.title" class="card-title">{{ item.title }}</h3>
              <p v-if="stripImage(item.description)" class="card-description" v-html="stripImage(item.description)"></p>
              <div v-if="item.detail" class="card-detail">
                <span v-if="parseDetail(item.detail).tag" class="detail-tag">{{ parseDetail(item.detail).tag }}</span>
                <span v-if="parseDetail(item.detail).text" class="detail-text" v-html="parseDetail(item.detail).text"></span>
              </div>
            </div>
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

function extractImage(html?: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=['"](.*?)['"]/);
  return match ? match[1] : null;
}

function stripImage(html?: string): string {
  if (!html) return '';
  return html.replace(/<img[^>]*>(\s*<br\s*\/?>)?/gi, '').trim();
}

function scrollToSection(idx: number) {
  const el = document.getElementById(`section-${idx}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function parseDetail(detail: string): { tag: string; text: string } {
  const sep = detail.indexOf('·');
  if (sep === -1) return { tag: detail.trim(), text: '' };
  return { tag: detail.slice(0, sep).trim(), text: detail.slice(sep + 1).trim() };
}

function parseLocation(loc: string) {
  const match = loc.match(/^(.*?)\s*\[(.+)]$/);
  return { text: match ? match[1].trim() : loc, url: match ? match[2].trim() : null };
}

</script>

<style scoped>
.info-page {
  max-width: 56rem;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  padding: 0.45rem 0.9rem;
  border: 1px solid #bfdbfe;
  border-radius: 2rem;
  background: #eff6ff;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  transform: translateX(-2px);
}

/* ─── Header ─── */
.info-header {
  margin-bottom: 2.5rem;
  padding: 2rem 2.25rem;
  background: linear-gradient(135deg, #0033a0 0%, #1e3a5f 60%, #6b1d3a 100%);
  border-radius: 1.25rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.info-header::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -15%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, transparent 70%);
  pointer-events: none;
}

.info-header::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.info-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 1rem;
  letter-spacing: -0.01em;
  line-height: 1.25;
  position: relative;
}

.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: relative;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  padding: 0.4rem 0.9rem;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.meta-chip svg {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.72rem;
}

/* ─── Table of Contents ─── */
.toc {
  margin-bottom: 2.5rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f0f5ff 0%, #faf5ff 100%);
  border: 1px solid #ddd6fe;
  border-radius: 1rem;
}

.toc::before {
  content: 'Jump to';
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin-bottom: 0.75rem;
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
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4338ca;
  text-decoration: none;
  background: #fff;
  border: 1px solid #c7d2fe;
  border-radius: 2rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toc-link:hover {
  background: #eef2ff;
  border-color: #818cf8;
  color: #3730a3;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(67, 56, 202, 0.12);
}

.toc-icon {
  font-size: 0.55rem;
  transition: transform 0.2s ease;
}

.toc-link:hover .toc-icon {
  transform: translateX(2px);
}

/* ─── No info ─── */
.no-info {
  text-align: center;
  color: #6b7280;
  padding: 3rem 1rem;
  font-size: 1rem;
  background: #f9fafb;
  border-radius: 1rem;
  border: 1px dashed #d1d5db;
}

/* ─── Sections ─── */
.info-section {
  margin-bottom: 3rem;
}

.section-header {
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 4px solid #0033a0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.35rem;
  letter-spacing: -0.01em;
}

.section-description {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

/* ─── Card Grid ─── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
}

.card {
  background: #fff;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06);
}

/* Card Image */
.card-image-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f1f5f9;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.card:hover .card-image {
  transform: scale(1.05);
}

/* Card Body */
.card-body {
  padding: 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
  line-height: 1.3;
}

.card-description {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.55;
  margin: 0 0 0.65rem;
  flex: 1;
}

.card-description :deep(a) {
  color: #4338ca;
  text-decoration: none;
}

.card-description :deep(a:hover) {
  text-decoration: underline;
}

.card-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem;
  margin-top: auto;
  padding-top: 0.7rem;
  border-top: 1px solid #f1f5f9;
}

.detail-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4338ca;
  background: #eef2ff;
  padding: 0.2rem 0.6rem;
  border-radius: 2rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-text {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.5;
}

/* Cards without images — compact horizontal style */
.card:not(.has-image) {
  flex-direction: row;
  align-items: center;
}

.card:not(.has-image) .card-body {
  padding: 0.85rem 1.1rem;
}

.card:not(.has-image) .card-title {
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.card:not(.has-image) .card-description {
  font-size: 0.82rem;
  margin-bottom: 0.35rem;
}

/* ─── Text content ─── */
.section-text {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.75;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.section-text :deep(a) {
  color: #4338ca;
  text-decoration: none;
  border-bottom: 1px solid #c7d2fe;
  transition: border-color 0.15s ease;
}

.section-text :deep(a:hover) {
  border-bottom-color: #4338ca;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .info-page {
    padding: 1rem;
  }

  .info-header {
    padding: 1.5rem 1.25rem;
    border-radius: 0.85rem;
  }

  .info-title {
    font-size: 1.35rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .card-image-wrap {
    height: 160px;
  }

  .toc {
    padding: 1rem 1.15rem;
    border-radius: 0.75rem;
  }

  .section-title {
    font-size: 1.25rem;
  }
}

@media (min-width: 641px) and (max-width: 900px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
