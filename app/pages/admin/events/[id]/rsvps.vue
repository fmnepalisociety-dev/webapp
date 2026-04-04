<template>
  <div>
    <NuxtLink to="/admin/events" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Events
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading RSVPs...</div>

    <template v-else-if="event">
      <div class="rsvps-header">
        <div>
          <h1 class="admin-page-title">{{ event.heading }}</h1>
          <p class="rsvps-meta">{{ event.event_date }} &middot; {{ rsvps.length }} RSVPs</p>
        </div>
        <button v-if="rsvps.length" class="admin-btn" @click="downloadCsv">
          <font-awesome-icon :icon="['fas', 'download']" />
          Download CSV
        </button>
      </div>

      <div v-if="!rsvps.length" class="admin-empty">No RSVPs yet for this event.</div>

      <div v-else class="rsvps-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th v-for="col in columns" :key="col">{{ formatHeader(col) }}</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rsvp, idx) in rsvps" :key="rsvp.id">
              <td>{{ idx + 1 }}</td>
              <td v-for="col in columns" :key="col">{{ displayValue(rsvp.responses[col]) }}</td>
              <td>{{ formatDate(rsvp.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="admin-empty">Event not found.</div>
  </div>
</template>

<script setup lang="ts">
import { getEvents } from '~/composables/useEvents';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const route = useRoute();
const eventId = route.params.id as string;
const { $supabase } = useNuxtApp();

const loading = ref(true);
const event = ref<any>(null);
const rsvps = ref<any[]>([]);
const columns = ref<string[]>([]);

onMounted(async () => {
  // Load event details
  const allEvents = await getEvents();
  event.value = allEvents.find((e: any) => e.id === eventId) ?? null;

  // Load RSVPs
  const { data, error } = await $supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[admin:rsvps]', error);
  } else {
    rsvps.value = data ?? [];
  }

  // Build column list from all response keys
  const colSet = new Set<string>();
  for (const r of rsvps.value) {
    if (r.responses && typeof r.responses === 'object') {
      Object.keys(r.responses).forEach((k) => colSet.add(k));
    }
  }
  columns.value = Array.from(colSet);

  loading.value = false;
});

function formatHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function downloadCsv() {
  const headers = ['#', ...columns.value, 'Submitted'];
  const rows = rsvps.value.map((r, idx) => [
    idx + 1,
    ...columns.value.map((col) => displayValue(r.responses[col])),
    formatDate(r.created_at),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell: unknown) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const eventName = (event.value?.heading ?? 'rsvps').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${eventName}_rsvps.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.admin-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.admin-back-link:hover {
  text-decoration: underline;
}

.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.rsvps-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.rsvps-meta {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
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
  transition: background 0.15s;
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

.rsvps-table-wrapper {
  overflow-x: auto;
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
  white-space: nowrap;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
}
</style>
