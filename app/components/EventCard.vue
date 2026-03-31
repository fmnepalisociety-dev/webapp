<template>
  <section class="event-info">
    <h2 class="text-2xl font-bold text-gray-800">{{ event.heading }}</h2>

    <NuxtLink
      v-if="showRsvp"
      :to="`/events/${event.id}/rsvp`"
      class="btn btn-blue"
    >
      <font-awesome-icon :icon="['fas', 'circle-check']" />
      RSVP for this event
    </NuxtLink>

    <p v-html="event.body" class="text-gray-700 leading-relaxed"></p>

    <table class="detail-table">
      <tbody>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'calendar-days']" class="text-blue-500" />
          </td>
          <td class="detail-label">Date</td>
          <td class="detail-value">{{ event.event_date }}</td>
        </tr>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'clock']" class="text-blue-500" />
          </td>
          <td class="detail-label">Time</td>
          <td class="detail-value font-semibold">{{ event.event_time }}</td>
        </tr>
        <tr>
          <td class="detail-icon">
            <font-awesome-icon :icon="['fas', 'location-dot']" class="text-blue-500" />
          </td>
          <td class="detail-label">Location</td>
          <td class="detail-value">
            <a
              v-if="locationUrl"
              :href="locationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline"
            >
              {{ locationText }}
            </a>
            <span v-else>{{ locationText }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="event.promo" v-html="event.promo" class="text-gray-600"></p>

    <ZoomImage v-if="event.image_path" :src="event.image_path" alt="Event Image" class="mt-4" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  event: {
    id: string;
    heading: string;
    body?: string;
    event_date: string;
    event_time: string;
    event_location: string;
    promo?: string;
    image_path?: string;
  };
  showRsvp?: boolean;
}>();

const locationText = computed(() => {
  if (!props.event.event_location) return '';
  const match = props.event.event_location.match(/^(.*?)\s*\[(.+)]$/);
  return match ? match[1].trim() : props.event.event_location;
});

const locationUrl = computed(() => {
  if (!props.event.event_location) return null;
  const match = props.event.event_location.match(/^(.*?)\s*\[(.+)]$/);
  return match ? match[2].trim() : null;
});
</script>

<style scoped>
.detail-table {
  border-collapse: separate;
  border-spacing: 0.75rem 0.4rem;
  margin-left: -0.75rem;
  width: auto;
}

.detail-table td {
  vertical-align: middle;
}

.detail-icon {
  width: 1.25rem;
  text-align: center;
}

.detail-label {
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
}

.detail-value {
  color: #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
