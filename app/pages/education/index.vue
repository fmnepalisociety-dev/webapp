<template>
  <main class="education-page">
    <header class="edu-hero">
      <div class="edu-hero-icon">
        <font-awesome-icon :icon="['fas', 'graduation-cap']" />
      </div>
      <div>
        <p class="edu-kicker">Nepali Society of Fargo-Moorhead</p>
        <h1 class="edu-title">Education</h1>
        <p class="edu-sub">Keeping our language, culture, and heritage alive</p>
      </div>
    </header>

    <section class="edu-intro">
      <h2 class="edu-intro-title">Nepali Pathsala — नेपाली पाठशाला</h2>
      <p>
        Nepali Pathsala is our community learning program to help the next generation
        stay connected to the Nepali language, culture, and heritage.
      </p>
      <p class="edu-intro-np">
        नेपाली पाठशाला हाम्रो सामुदायिक शिक्षा कार्यक्रम हो, जसले नयाँ पुस्तालाई नेपाली
        भाषा, संस्कृति र सम्पदासँग जोडिराख्न मद्दत गर्छ।
      </p>
    </section>

    <div v-if="loading" class="edu-status">Loading…</div>

    <p v-else-if="!items.length" class="edu-note">
      Program flyers and schedules will be posted here. Check back soon for the next
      session.
    </p>

    <section v-else class="edu-items">
      <article v-for="item in items" :key="item.id" class="edu-card">
        <div v-if="images[item.id]" class="edu-card-flyer">
          <ZoomImage :src="images[item.id]!" :alt="item.title" img-class="edu-flyer-img" />
        </div>

        <div class="edu-card-body">
          <div class="edu-card-head">
            <h3 class="edu-card-title">{{ item.title }}</h3>
            <span v-if="recurrenceLabel(item)" class="edu-recurring">
              <font-awesome-icon :icon="['fas', 'rotate']" />
              {{ recurrenceLabel(item) }}
            </span>
          </div>

          <p v-if="item.description" class="edu-card-desc">{{ item.description }}</p>

          <ul v-if="item.event_time || item.location" class="edu-details">
            <li v-if="item.event_time">
              <font-awesome-icon :icon="['fas', 'clock']" class="edu-detail-icon" />
              <span>{{ item.event_time }}</span>
            </li>
            <li v-if="item.location">
              <font-awesome-icon :icon="['fas', 'location-dot']" class="edu-detail-icon" />
              <span>{{ item.location }}</span>
            </li>
          </ul>

          <div v-if="sessions[item.id]?.length" class="edu-sessions">
            <p class="edu-sessions-label">
              <font-awesome-icon :icon="['fas', 'calendar-days']" />
              Upcoming sessions
            </p>
            <ul class="edu-session-list">
              <li
                v-for="s in sessions[item.id]"
                :key="s.iso"
                :class="{ 'edu-session--cancelled': s.cancelled }"
              >
                <span class="edu-session-date">{{ formatSession(s.date) }}</span>
                <span v-if="s.cancelled" class="edu-session-tag">Cancelled</span>
              </li>
            </ul>
          </div>
          <p v-else-if="item.event_date" class="edu-sessions-none">
            No upcoming sessions scheduled right now.
          </p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {getActiveEducation, upcomingSessions} from '~/composables/useEducation';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';
import type {EducationItem, Session} from '~/types/education';

useHead({title: 'Education — Nepali Pathsala'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const items = ref<EducationItem[]>([]);
const images = ref<Record<number, string | null>>({});
const sessions = ref<Record<number, Session[]>>({});

onMounted(async () => {
  items.value = await getActiveEducation();
  for (const item of items.value) {
    images.value[item.id] = item.image_path
      ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, item.image_path)
      : null;
    sessions.value[item.id] = upcomingSessions(item, 5);
  }
  loading.value = false;
});

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function recurrenceLabel(item: EducationItem): string {
  if (!item.recurrence_freq || !item.event_date) return '';
  const [y, m, d] = item.event_date.split('-').map(Number);
  const name = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  if (item.recurrence_freq === 'weekly') return `Weekly on ${name}s`;
  if (item.recurrence_freq === 'biweekly') return `Every other ${name}`;
  return 'Monthly';
}

function formatSession(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<style scoped>
.education-page {
  max-width: 74rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.edu-hero {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1.5rem;
  border-radius: 0.9rem;
  background: linear-gradient(120deg, rgba(28, 51, 130, 0.95), rgba(163, 20, 50, 0.9));
  color: #fff;
  margin-bottom: 1.75rem;
}

.edu-hero-icon {
  font-size: 2.4rem;
  width: 3.6rem;
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  flex-shrink: 0;
}

.edu-kicker {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.edu-title {
  margin: 0.1rem 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.edu-sub {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.edu-intro {
  max-width: 46rem;
  margin-bottom: 2rem;
}

.edu-intro-title {
  margin: 0 0 0.9rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1c3382;
}

.edu-intro p {
  margin: 0 0 1rem;
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
}

.edu-intro-np {
  color: #a31432;
  font-weight: 600;
}

.edu-status {
  color: #64748b;
  padding: 1rem 0;
}

.edu-note {
  padding: 0.9rem 1.1rem;
  border-radius: 0.6rem;
  background: rgba(28, 51, 130, 0.06);
  border-left: 3px solid #1c3382;
  font-size: 0.95rem;
  color: #444;
}

.edu-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.edu-card {
  display: grid;
  grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.edu-card-flyer :deep(.edu-flyer-img) {
  width: 100%;
  height: auto;
}

.edu-card-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.edu-card-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #1c3382;
}

.edu-recurring {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #a31432;
  background: rgba(163, 20, 50, 0.08);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

.edu-card-desc {
  margin: 0 0 1.25rem;
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
  white-space: pre-line;
}

.edu-details {
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edu-details li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
}

.edu-detail-icon {
  color: #1c3382;
  font-size: 1rem;
  width: 1.3rem;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.edu-sessions {
  border-top: 1px solid #eee;
  padding-top: 1.1rem;
}

.edu-sessions-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1c3382;
}

.edu-session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.edu-session-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  color: #333;
}

.edu-session--cancelled .edu-session-date {
  text-decoration: line-through;
  color: #94a3b8;
}

.edu-session-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #a31432;
  background: rgba(163, 20, 50, 0.1);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.edu-sessions-none {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .edu-card {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .edu-card-flyer {
    max-width: 26rem;
  }
}

@media (max-width: 520px) {
  .education-page {
    padding: 1rem;
  }
  .edu-title {
    font-size: 1.4rem;
  }
}
</style>
