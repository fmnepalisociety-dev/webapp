<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <div class="back-link-wrapper">
      <NuxtLink to="/events" class="back-link">
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
        Back to All Events
      </NuxtLink>
    </div>

    <h1 class="text-3xl font-bold text-blue-800 mb-6">Upcoming Events</h1>

    <section v-if="upcomingEvents.length > 0" class="space-y-4">
      <EventCard
        v-for="event in upcomingEvents"
        :key="event.id"
        :event="event"
      />
    </section>

    <p v-else class="text-gray-600 italic">No upcoming events at the moment.</p>

  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getUpcomingEvents } from '~/composables/useEvents';

const upcomingEvents = ref(await getUpcomingEvents());
</script>

<style scoped>
.back-link-wrapper {
  margin-bottom: 1rem;
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
