<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <div v-if="!event" class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-700 mb-2">Event Not Found</h1>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
    </div>

    <template v-else>
      <div class="back-link-wrapper">
        <NuxtLink to="/events" class="back-link">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Back to All Events
        </NuxtLink>
      </div>

      <EventCard :event="event" expanded />

      <!-- Events linked to a tournament show both teams' squads inline. -->
      <section v-if="tournament" class="event-squads">
        <h2 class="event-squads-title">
          <font-awesome-icon :icon="['fas', 'futbol']" />
          {{ tournament.name }} — Squads
        </h2>
        <TournamentSquads :tournament="tournament" />
      </section>

      <!-- Events linked to an education program point to its page. -->
      <section v-if="educationItem" class="event-education">
        <h2 class="event-education-title">
          <font-awesome-icon :icon="['fas', 'graduation-cap']" />
          {{ educationItem.title }}
        </h2>
        <ul v-if="educationSessions.length" class="event-session-list">
          <li
            v-for="s in educationSessions"
            :key="s.iso"
            :class="{ 'session--cancelled': s.cancelled }"
          >
            <span>{{ formatSession(s.date) }}</span>
            <span v-if="s.cancelled" class="session-tag">Cancelled</span>
          </li>
        </ul>
        <NuxtLink to="/education" class="education-link">
          View program details
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </NuxtLink>
      </section>
    </template>

  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getEvents } from '~/composables/useEvents';
import { getTournament } from '~/composables/useSquad';
import { getEducationItem, upcomingSessions } from '~/composables/useEducation';

const route = useRoute();
const eventId = route.params.id as string;

const allEvents = await getEvents();
const event = ref(allEvents.find((e: any) => e.id === eventId) ?? null);

// Show the squads block when the event is linked to a tournament (via the
// `tournament_key` column). Both legs link to the same tournament.
const tournament = computed(() => getTournament(event.value?.tournament_key));

// Show a linked education program when content_type is 'education'.
const ev = event.value as any;
const educationItem =
  ev?.content_type === 'education' && ev?.content_key
    ? await getEducationItem(ev.content_key)
    : null;
const educationSessions = educationItem ? upcomingSessions(educationItem, 5) : [];

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
.event-squads {
  margin-top: 2rem;
}

.event-squads-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.event-education {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.event-education-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1c3382;
  margin: 0 0 1rem;
}

.event-session-list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.event-session-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  color: #333;
}

.session--cancelled span:first-child {
  text-decoration: line-through;
  color: #94a3b8;
}

.session-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #a31432;
  background: rgba(163, 20, 50, 0.1);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.education-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: #1c3382;
  text-decoration: none;
}

.education-link:hover {
  text-decoration: underline;
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

.back-link:active {
  background: #bfdbfe;
}
</style>
