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
    </template>

  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getEvents } from '~/composables/useEvents';
import { getTournament } from '~/composables/useSquad';

const route = useRoute();
const eventId = route.params.id as string;

const allEvents = await getEvents();
const event = ref(allEvents.find((e: any) => e.id === eventId) ?? null);

// Show the squads block when the event is linked to a tournament (via the
// `tournament_key` column). Both legs link to the same tournament.
const tournament = computed(() => getTournament(event.value?.tournament_key));
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
