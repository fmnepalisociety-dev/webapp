<template>
  <div>
    <h1 class="admin-page-title">Events</h1>

    <div v-if="loading" class="admin-loading">Loading events...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Event</th>
          <th>Date</th>
          <th>RSVP</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in events" :key="event.id">
          <td>{{ event.heading }}</td>
          <td>{{ event.event_date }}</td>
          <td>
            <span v-if="event.rsvp?.active" class="admin-badge admin-badge--green">Active</span>
            <span v-else class="admin-badge admin-badge--gray">Off</span>
          </td>
          <td class="actions-cell">
            <NuxtLink
              :to="`/admin/events/${event.id}/info`"
              class="admin-link"
            >
              Edit Info
            </NuxtLink>
            <NuxtLink
              v-if="event.rsvp?.active"
              :to="`/admin/events/${event.id}/rsvps`"
              class="admin-link"
            >
              View RSVPs
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { getEvents } from '~/composables/useEvents';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const loading = ref(true);
const events = ref<any[]>([]);

onMounted(async () => {
  events.value = await getEvents();
  // Show most recent first
  events.value.reverse();
  loading.value = false;
});
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.admin-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
}

.admin-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.admin-badge--green {
  background: #dcfce7;
  color: #166534;
}

.admin-badge--gray {
  background: #f1f5f9;
  color: #64748b;
}

.admin-link {
  color: #2563eb;
  font-size: 0.85rem;
  text-decoration: none;
  font-weight: 600;
}

.admin-link:hover {
  text-decoration: underline;
}

.actions-cell {
  display: flex;
  gap: 1rem;
}
</style>
