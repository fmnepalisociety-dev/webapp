<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <div v-if="!event" class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-700 mb-2">Event Not Found</h1>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
    </div>

    <template v-else>
      <NuxtLink to="/events" class="text-blue-600 hover:underline text-sm inline-flex items-center gap-1">
        <font-awesome-icon :icon="['fas', 'arrow-left']" class="text-xs" />
        All Events
      </NuxtLink>

      <EventCard :event="event" :show-rsvp="hasRsvp" />
    </template>

  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getEvents } from '~/composables/useEvents';
import { getEventsWithRsvp } from '~/composables/useRsvp';

const route = useRoute();
const eventId = route.params.id as string;

const [allEvents, rsvpEventIds] = await Promise.all([getEvents(), getEventsWithRsvp()]);

const event = ref(allEvents.find((e: any) => e.id === eventId) ?? null);
const hasRsvp = ref(new Set(rsvpEventIds).has(eventId));
</script>
