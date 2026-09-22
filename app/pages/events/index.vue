<template>
  <main class="events-page">

    <h1 class="page-title">Events</h1>

    <!-- Jump bar -->
    <nav class="jump-bar">
      <button class="jump-chip jump-chip--upcoming" @click="jumpTo('upcoming')">
        <font-awesome-icon :icon="['fas', 'calendar-check']" />
        Upcoming
      </button>
      <button class="jump-chip jump-chip--recurring" @click="jumpTo('recurring')">
        <font-awesome-icon :icon="['fas', 'rotate']" />
        Recurring
      </button>
      <button class="jump-chip jump-chip--past" @click="jumpTo('past')">
        <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
        Past
      </button>
    </nav>

    <!-- Upcoming -->
    <section id="upcoming" class="event-section">
      <NuxtLink to="/events/upcoming" class="section-header section-header--upcoming">
        <font-awesome-icon :icon="['fas', 'calendar-check']" />
        <span>Upcoming Events</span>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="section-arrow" />
      </NuxtLink>
      <ul class="event-list">
        <li v-for="event in upcomingEvents" :key="event.id" class="event-item">
          <NuxtLink :to="`/events/${event.id}`" class="event-link">
            <div class="event-link-content">
              <span class="event-name">{{ event.heading }}</span>
              <span class="event-date">
                <font-awesome-icon :icon="['fas', 'calendar-days']" class="date-icon" />
                {{ event.event_date }}
              </span>
            </div>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="event-chevron" />
          </NuxtLink>
        </li>
        <li v-if="upcomingEvents.length === 0" class="event-empty">No upcoming events</li>
      </ul>
    </section>

    <EventCard v-for="event in upcomingEvents" :key="'up-' + event.id" :event="event" />

    <!-- Recurring -->
    <section id="recurring" class="event-section">
      <NuxtLink to="/events/recurring" class="section-header section-header--recurring">
        <font-awesome-icon :icon="['fas', 'rotate']" />
        <span>Recurring Events</span>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="section-arrow" />
      </NuxtLink>
      <ul class="event-list">
        <li v-for="event in recurringEvents" :key="event.id" class="event-item">
          <NuxtLink :to="`/events/${event.id}`" class="event-link">
            <div class="event-link-content">
              <span class="event-name">{{ event.heading }}</span>
              <span class="event-date">
                <font-awesome-icon :icon="['fas', 'rotate']" class="date-icon" />
                {{ recurringWhen(event) }}
              </span>
            </div>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="event-chevron" />
          </NuxtLink>
        </li>
        <li v-if="recurringEvents.length === 0" class="event-empty">No recurring events</li>
      </ul>
    </section>

    <EventCard v-for="event in recurringEvents" :key="'rec-' + event.id" :event="event" />

    <!-- Past -->
    <section id="past" class="event-section">
      <NuxtLink to="/events/past" class="section-header section-header--past">
        <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
        <span>Past Events</span>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="section-arrow" />
      </NuxtLink>
      <ul class="event-list">
        <li v-for="event in pastEvents" :key="event.id" class="event-item">
          <NuxtLink :to="`/events/${event.id}`" class="event-link">
            <div class="event-link-content">
              <span class="event-name">{{ event.heading }}</span>
              <span class="event-date">
                <font-awesome-icon :icon="['fas', 'calendar-days']" class="date-icon" />
                {{ event.event_date }}
              </span>
            </div>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="event-chevron" />
          </NuxtLink>
        </li>
        <li v-if="pastEvents.length === 0" class="event-empty">No past events</li>
      </ul>
    </section>

    <EventCard v-for="event in pastEvents" :key="'past-' + event.id" :event="event" />

  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getUpcomingEvents, getRecurringEvents, getPastEvents } from '~/composables/useEvents';
import { nextSession, recurrenceLabel } from '~/composables/useRecurrence';

const [upcoming, recurring, past] = await Promise.all([
  getUpcomingEvents(),
  getRecurringEvents(),
  getPastEvents(),
]);

const upcomingEvents = ref(upcoming);
const recurringEvents = ref(recurring);
const pastEvents = ref(past);

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function recurringWhen(event: any): string {
  const label = recurrenceLabel(event.start_date, event.recurrence_freq);
  const next = nextSession(event.start_date, event.recurrence_freq, event.cancelled_dates ?? []);
  const nextText = next
    ? `next ${next.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : '';
  return [label, nextText].filter(Boolean).join(' · ') || 'Recurring';
}
</script>

<style scoped>
.events-page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e3a5f;
  margin-bottom: 1rem;
}

/* Jump bar */
.jump-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.jump-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.jump-chip:hover {
  background: #f0f7ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.jump-chip--recurring:hover {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #a31432;
}

.jump-chip--past:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #4b5563;
}

.event-section {
  margin-bottom: 2rem;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
  scroll-margin-top: 5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: filter 0.15s;
}

.section-header:hover {
  filter: brightness(1.1);
}

.section-header--upcoming {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.section-header--recurring {
  background: linear-gradient(135deg, #a31432, #7f1d1d);
}

.section-header--past {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.section-arrow {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.7;
}

.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.event-item {
  border-bottom: 1px solid #e5e7eb;
}

.event-item:last-child {
  border-bottom: none;
}

.event-link {
  display: flex;
  align-items: center;
  padding: 0.85rem 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
}

.event-link:hover {
  background: #f0f7ff;
}

.event-link:active {
  background: #dbeafe;
}

.event-link-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.event-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e3a5f;
}

.event-date {
  font-size: 0.8rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.date-icon {
  font-size: 0.7rem;
  color: #9ca3af;
}

.event-chevron {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
  margin-left: 0.75rem;
}

.event-empty {
  padding: 1.25rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
  font-style: italic;
}

@media (max-width: 480px) {
  .events-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .event-link {
    padding: 0.75rem 1rem;
  }
}
</style>
