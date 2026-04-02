<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <div class="back-link-wrapper">
      <NuxtLink to="/events" class="back-link">
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
        Back to All Events
      </NuxtLink>
    </div>

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
