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

      <!-- Totals summary -->
      <div v-if="rsvps.length" class="totals-bar">
        <div class="total-card">
          <span class="total-label">Entries</span>
          <span class="total-value">
            {{ filteredRsvps.length }}
            <span v-if="isFiltered" class="total-of">/ {{ rsvps.length }}</span>
          </span>
        </div>
        <div class="total-card" v-for="t in totalCards" :key="t.key">
          <span class="total-label">{{ t.label }}</span>
          <span class="total-value">
            {{ t.filtered }}
            <span v-if="isFiltered" class="total-of">/ {{ t.total }}</span>
          </span>
        </div>
      </div>

      <!-- Search + Reset -->
      <div v-if="rsvps.length" class="table-toolbar">
        <button v-if="isFiltered" class="clear-btn" @click="resetFilters">
          <font-awesome-icon :icon="['fas', 'xmark']" />
          Clear Filters
        </button>
        <div class="search-bar">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search RSVPs..."
            class="search-input"
          />
        </div>
      </div>

      <div v-if="rsvps.length" class="rsvps-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th v-for="col in columns" :key="col">
                {{ formatHeader(col) }}
                <div v-if="filterMap[col]" class="th-filter-row">
                  <select
                    v-model="activeFilters[col]"
                    class="th-filter"
                    :class="{ 'th-filter--active': activeFilters[col] }"
                  >
                    <option value="">All</option>
                    <option v-for="opt in filterMap[col]" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rsvp, idx) in filteredRsvps" :key="rsvp.id">
              <td>{{ idx + 1 }}</td>
              <td v-for="col in columns" :key="col">{{ displayValue(rsvp.responses[col]) }}</td>
              <td>{{ formatDate(rsvp.created_at) }}</td>
            </tr>
            <tr v-if="!filteredRsvps.length">
              <td :colspan="columns.length + 2" class="admin-empty">No results match your search/filters.</td>
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
import type { RsvpConfig } from '~/composables/useRsvp';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const route = useRoute();
const eventId = route.params.id as string;
const { $supabase } = useNuxtApp();

const loading = ref(true);
const event = ref<any>(null);
const rsvps = ref<any[]>([]);
const columns = ref<string[]>([]);
const searchQuery = ref('');
const activeFilters = reactive<Record<string, string>>({});

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

  // Initialize filter keys so selects default to "All"
  const rsvpConfig = event.value?.rsvp as RsvpConfig | undefined;
  if (rsvpConfig?.filters) {
    for (const f of rsvpConfig.filters) {
      activeFilters[f.key] = '';
    }
  }

  loading.value = false;
});

const filterMap = computed(() => {
  const rsvpConfig = event.value?.rsvp as RsvpConfig | undefined;
  if (!rsvpConfig?.filters?.length) return {} as Record<string, string[]>;
  const map: Record<string, string[]> = {};
  for (const f of rsvpConfig.filters) {
    const optSet = new Set<string>();
    for (const r of rsvps.value) {
      const val = r.responses?.[f.key];
      if (val != null && val !== '') {
        optSet.add(typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val));
      }
    }
    map[f.key] = Array.from(optSet).sort();
  }
  return map;
});

const filteredRsvps = computed(() => {
  let result = rsvps.value;

  // Apply dropdown filters
  for (const key of Object.keys(activeFilters)) {
    const filterVal = activeFilters[key];
    if (!filterVal) continue;
    result = result.filter((r) => {
      const val = r.responses?.[key];
      const display = val == null || val === '' ? '-'
        : typeof val === 'boolean' ? (val ? 'Yes' : 'No')
        : String(val);
      return display === filterVal;
    });
  }

  // Apply search
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter((r) => {
      if (!r.responses || typeof r.responses !== 'object') return false;
      return Object.values(r.responses).some(
        (val) => val != null && String(val).toLowerCase().includes(q)
      );
    });
  }

  return result;
});

function sumField(list: any[], key: string): number {
  return list.reduce((sum, r) => {
    const val = parseFloat(r.responses?.[key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}

const isFiltered = computed(() => filteredRsvps.value.length !== rsvps.value.length);

function resetFilters() {
  searchQuery.value = '';
  for (const key of Object.keys(activeFilters)) {
    activeFilters[key] = '';
  }
}

const totalCards = computed(() => {
  const rsvpConfig = event.value?.rsvp as RsvpConfig | undefined;
  if (!rsvpConfig?.totals?.length) return [];
  return rsvpConfig.totals.map((t) => ({
    key: t.key,
    label: t.label,
    filtered: sumField(filteredRsvps.value, t.key),
    total: sumField(rsvps.value, t.key),
  }));
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
  padding: 0.6rem 0.75rem;
  background: #f1f5f9;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  vertical-align: top;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
}

.th-filter-row {
  margin-top: 0.3rem;
}

.th-filter {
  width: 100%;
  box-sizing: border-box;
  padding: 0.15rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.2rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
  background: white;
  cursor: pointer;
  text-transform: none;
  letter-spacing: normal;
}

.th-filter:focus {
  outline: none;
  border-color: #2563eb;
}

.th-filter--active {
  border-color: #2563eb;
  color: #1e40af;
  background: #eff6ff;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.clear-btn:hover {
  background: #fecaca;
}

.search-bar {
  position: relative;
  width: 16rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.totals-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.total-card {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-width: 7rem;
}

.total-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 0.15rem;
}

.total-of {
  font-size: 0.9rem;
  font-weight: 500;
  color: #94a3b8;
}
</style>
