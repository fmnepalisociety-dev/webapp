<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <h1 class="text-3xl font-bold text-blue-800 mb-6">Past Events</h1>

    <section v-if="pastEvents.length > 0" class="space-y-4">
      <EventCard
        v-for="event in pastEvents"
        :key="event.id"
        :event="event"
      />
    </section>

    <p v-else class="text-gray-600 italic">No past events available.</p>

  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getPastEvents } from '~/composables/useEvents';

const pastEvents = ref(await getPastEvents());
</script>
