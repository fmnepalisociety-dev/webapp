<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

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
