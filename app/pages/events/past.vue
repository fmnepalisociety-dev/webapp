<template>
  <main class="p-6 max-w-4xl mx-auto space-y-6">

    <h1 class="text-3xl font-bold text-blue-800 mb-6">Past Events</h1>

    <section v-if="pastEvents.length > 0" class="space-y-4">
      <div
        v-for="event in pastEvents"
        :key="event.id"
        class="event-info"
      >
        <div class="bg-blue-400 px-4 py-2 text-white font-bold text-lg">
          {{ event.heading }}
        </div>
        <div class="p-4 bg-blue-50 space-y-2">
          <p v-html="event.body" class="text-gray-700 leading-relaxed"></p>
          <ul class="text-blue-900 space-y-1">
            <li><strong>Date:</strong> {{ event.event_date }}</li>
            <li><strong>Time:</strong> {{ event.event_time }}</li>
            <li>
              <strong>Location:</strong>
              <a :href="event.event_location" target="_blank" class="text-blue-600 hover:underline">
                {{ event.event_location }}
              </a>
            </li>
          </ul>
          <p v-if="event.promo" v-html="event.promo" class="text-gray-600"></p>
          <img v-if="event.image_path" :src="event.image_path" alt="Event Image" class="mt-2 rounded shadow-sm w-full"/>
        </div>
      </div>
    </section>

    <p v-else class="text-gray-600 italic">No past events available.</p>

  </main>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {getPastEvents} from '~/composables/useEvents'

const pastEvents = ref(await getPastEvents())
</script>
