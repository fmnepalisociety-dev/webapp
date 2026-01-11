<template>
  <main class="p-6 max-w-3xl mx-auto">

    <!-- Upcoming Events Card -->
    <section class="event-card group">
      <NuxtLink to="/events/upcoming" class="block">
        <h2 class="text-xl font-bold text-white bg-blue-400 rounded-t-lg px-4 py-2">Upcoming Events</h2>
      </NuxtLink>
      <ul class="bg-blue-50 rounded-b-lg p-4 space-y-2">
        <li v-for="(event, index) in upcomingEvents" :key="event.id"
            class="flex justify-between items-center p-2 rounded hover:bg-blue-100 transition">
          <span class="font-medium text-blue-900">{{ event.heading }}</span>
          <span class="text-sm text-blue-700">{{ event.event_date }}</span>
        </li>
        <li v-if="upcomingEvents.length === 0" class="text-blue-900 text-sm italic">No upcoming events</li>
      </ul>
    </section>

    <!-- Past Events Card -->
    <section class="event-card group">
      <NuxtLink to="/events/past" class="block">
        <h2 class="text-xl font-bold text-white bg-blue-400 rounded-t-lg px-4 py-2">Past Events</h2>
      </NuxtLink>
      <ul class="bg-blue-50 rounded-b-lg p-4 space-y-2">
        <li v-for="(event, index) in pastEvents" :key="event.id"
            class="flex justify-between items-center p-2 rounded hover:bg-blue-100 transition">
          <span class="font-medium text-blue-900">{{ event.heading }}</span>
          <span class="text-sm text-blue-700">{{ event.event_date }}</span>
        </li>
        <li v-if="pastEvents.length === 0" class="text-blue-900 text-sm italic">No past events</li>
      </ul>
    </section>

    <!-- Latest upcoming event -->
    <section
      v-if="latestUpcoming"
      class="event-info"
    >
      <h2 class="text-2xl font-bold text-gray-800">{{ latestUpcoming.heading }}</h2>
      <p v-html="latestUpcoming.body" class="text-gray-700 leading-relaxed"></p>

      <ul class="space-y-2 text-gray-700">
        <li><strong>Date:</strong> {{ latestUpcoming.event_date }}</li>
        <li><strong>Time:</strong> <span class="font-semibold">{{ latestUpcoming.event_time }}</span></li>
        <li>
          <strong>Location:</strong>
          <a :href="latestUpcoming.event_location" target="_blank" class="text-blue-600 hover:underline">
            {{ latestUpcoming.event_location }}
          </a>
        </li>
      </ul>

      <p v-if="latestUpcoming.promo" v-html="latestUpcoming.promo" class="text-gray-600"></p>

      <img v-if="latestUpcoming.image_path" :src="latestUpcoming.image_path" alt="Event Image"
           class="mt-4 rounded-lg shadow-sm"/>

      <NuxtLink
        v-if="upcomingEvents.length > 1"
        to="/events/upcoming"
        class="btn btn-blue mt-4"
      >
        See all upcoming events →
      </NuxtLink>
    </section>

    <!-- Latest past event -->
    <section
      v-if="latestPast"
      class="event-info"
    >
      <h2 class="text-2xl font-bold text-gray-800">{{ latestPast.heading }}</h2>
      <p v-html="latestPast.body" class="text-gray-700 leading-relaxed"></p>

      <ul class="space-y-2 text-gray-700">
        <li><strong>Date:</strong> {{ latestPast.event_date }}</li>
        <li><strong>Time:</strong> <span class="font-semibold">{{ latestPast.event_time }}</span></li>
        <li>
          <strong>Location:</strong>
          <a :href="latestPast.event_location" target="_blank" class="text-blue-600 hover:underline">
            {{ latestPast.event_location }}
          </a>
        </li>
      </ul>

      <p v-if="latestPast.promo" v-html="latestPast.promo" class="text-gray-600"></p>

      <img v-if="latestPast.image_path" :src="latestPast.image_path" alt="Event Image"
           class="mt-4 rounded-lg shadow-sm"/>

      <NuxtLink
        v-if="pastEvents.length > 1"
        to="/events/past"
        class="btn btn-gray mt-4"
      >
        See all past events →
      </NuxtLink>
    </section>

  </main>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {getUpcomingEvents, getPastEvents} from '~/composables/useEvents'

const upcomingEvents = ref([])
upcomingEvents.value = await getUpcomingEvents()

const pastEvents = ref([])
pastEvents.value = await getPastEvents()

const latestUpcoming = computed(() => upcomingEvents.value[0] || null)
const latestPast = computed(() => pastEvents.value[pastEvents.value.length - 1] || null)
</script>

<style scoped>
.event-info ul {
  list-style-type: none;
  padding-left: 0;
}

.event-info li {
  margin-bottom: 0.25rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* Gray button (Past Events) */
.btn-gray {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-gray:hover {
  background-color: #d1d5db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-gray:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Blue button (Upcoming Events) */
.btn-blue {
  background-color: #2563eb;
  color: white;
}

.btn-blue:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-blue:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
