<template>
  <div>
    <div class="education-header">
      <h1 class="admin-page-title">Education</h1>
      <NuxtLink to="/admin/events/new?category=education" class="admin-btn">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Education Event
      </NuxtLink>
    </div>

    <p class="admin-hint">
      Education programs are events with the “Education” category. They appear here and on
      the public <NuxtLink to="/education">/education</NuxtLink> page. Edit one to change its
      flyer, schedule, or recurrence.
    </p>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <div v-else-if="!items.length" class="admin-empty">
      No education events yet. Click “New Education Event” to add one.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Schedule</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in items" :key="e.id">
          <td>
            <img v-if="thumbs[e.id]" :src="thumbs[e.id]!" class="row-thumb" :alt="e.heading" />
          </td>
          <td>{{ e.heading }}</td>
          <td class="window-cell">{{ scheduleText(e) }}</td>
          <td class="actions-cell">
            <NuxtLink class="admin-link" :to="`/admin/events/${e.id}/edit`">Edit</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {getEventsByCategory, eventRecurrence} from '~/composables/useEvents';
import {nextSession, recurrenceLabel} from '~/composables/useRecurrence';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

definePageMeta({layout: 'admin', middleware: 'auth'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const items = ref<any[]>([]);
const thumbs = ref<Record<string, string | null>>({});

onMounted(async () => {
  items.value = await getEventsByCategory('education');
  for (const e of items.value) {
    thumbs.value[e.id] = e.image?.[0] ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, e.image[0]) : null;
  }
  loading.value = false;
});

function scheduleText(e: any): string {
  const rec = eventRecurrence(e);
  if (!rec) return e.event_date || '—';
  const label = recurrenceLabel(rec.start_date, rec.freq);
  const next = nextSession(rec.start_date, rec.freq, rec.cancelled_dates ?? []);
  const nextText = next
    ? `next ${next.date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`
    : 'no upcoming session';
  return [label, nextText].filter(Boolean).join(' · ');
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.education-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.admin-hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.5rem;
}

.admin-hint a {
  color: #2563eb;
  text-decoration: none;
}

.admin-hint a:hover {
  text-decoration: underline;
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.admin-btn:hover {
  background: #002080;
}

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.admin-empty {
  color: #94a3b8;
  padding: 2rem 0;
  text-align: center;
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
  vertical-align: middle;
}

.row-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 0.35rem;
  border: 1px solid #e2e8f0;
  display: block;
}

.window-cell {
  font-size: 0.82rem;
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
  white-space: nowrap;
}
</style>
