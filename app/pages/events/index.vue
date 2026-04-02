<template>
  <main class="p-6 max-w-3xl mx-auto">

    <!-- Upcoming Events List -->
    <section class="event-card group">
      <NuxtLink to="/events/upcoming" class="block">
        <h2 class="text-xl font-bold text-white bg-blue-400 rounded-t-lg px-4 py-2">Upcoming Events</h2>
      </NuxtLink>
      <ul class="bg-blue-50 rounded-b-lg p-4 space-y-2">
        <li v-for="event in upcomingEvents" :key="event.id"
            class="p-2 rounded hover:bg-blue-100 transition">
          <NuxtLink :to="`/events/${event.id}`" class="font-medium text-blue-900 hover:underline">{{ event.heading }}</NuxtLink>
          <span class="text-blue-400" style="margin: 0 0.5rem;">|</span>
          <span class="text-sm text-blue-700">{{ event.event_date }}</span>
        </li>
        <li v-if="upcomingEvents.length === 0" class="text-blue-900 text-sm italic">No upcoming events</li>
      </ul>
    </section>

    <!-- Upcoming Event Banners -->
    <EventCard
      v-for="event in upcomingEvents"
      :key="'detail-' + event.id"
      :event="event"
    />

    <!-- Past Events List -->
    <section class="event-card group">
      <NuxtLink to="/events/past" class="block">
        <h2 class="text-xl font-bold text-white bg-blue-400 rounded-t-lg px-4 py-2">Past Events</h2>
      </NuxtLink>
      <ul class="bg-blue-50 rounded-b-lg p-4 space-y-2">
        <li v-for="event in pastEvents" :key="event.id"
            class="p-2 rounded hover:bg-blue-100 transition">
          <NuxtLink :to="`/events/${event.id}`" class="font-medium text-blue-900 hover:underline">{{ event.heading }}</NuxtLink>
          <span class="text-blue-400" style="margin: 0 0.5rem;">|</span>
          <span class="text-sm text-blue-700">{{ event.event_date }}</span>
        </li>
        <li v-if="pastEvents.length === 0" class="text-blue-900 text-sm italic">No past events</li>
      </ul>
    </section>

    <!-- Past Event Banners -->
    <EventCard
      v-for="event in pastEvents"
      :key="'detail-' + event.id"
      :event="event"
    />

  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getUpcomingEvents, getPastEvents } from '~/composables/useEvents';

const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

const upcomingEvents = ref(upcoming);
const pastEvents = ref(past);
</script>
