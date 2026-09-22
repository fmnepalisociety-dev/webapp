<template>
  <div>
    <h1 class="admin-page-title">Audit Log</h1>
    <p class="hint">Every create, update, and delete by an admin or the system (service key), with who did it. Front-facing public submissions (RSVPs, applications, orders) are not logged. Newest first.</p>

    <div class="filter-bar">
      <select v-model="tableFilter" class="filter-select">
        <option value="">All tables</option>
        <option v-for="t in tables" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="actionFilter" class="filter-select">
        <option value="">All actions</option>
        <option value="INSERT">Create</option>
        <option value="UPDATE">Update</option>
        <option value="DELETE">Delete</option>
      </select>
    </div>

    <div v-if="loading" class="admin-loading">Loading…</div>
    <div v-else-if="!filtered.length" class="admin-empty">No audit entries.</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>When</th>
          <th>Who</th>
          <th>Action</th>
          <th>Table</th>
          <th>Record</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="e in filtered" :key="e.id">
          <tr>
            <td class="nowrap">{{ fmt(e.created_at) }}</td>
            <td>{{ who(e) }}</td>
            <td><span :class="['action-badge', actionClass(e.action)]">{{ label(e.action) }}</span></td>
            <td>{{ e.table_name }}</td>
            <td class="mono">{{ shortId(e.record_id) }}</td>
            <td>
              <button class="admin-link" @click="toggle(e.id)">
                {{ openId === e.id ? 'Hide' : 'Details' }}
              </button>
            </td>
          </tr>
          <tr v-if="openId === e.id" class="detail-row">
            <td colspan="6">
              <div class="diff-grid">
                <div v-if="e.old_data">
                  <h4 class="diff-title">Before</h4>
                  <pre class="diff-pre">{{ pretty(e.old_data) }}</pre>
                </div>
                <div v-if="e.new_data">
                  <h4 class="diff-title">After</h4>
                  <pre class="diff-pre">{{ pretty(e.new_data) }}</pre>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import {getAuditLog, type AuditEntry} from '~/composables/useAudit';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
const entries = ref<AuditEntry[]>([]);
const tableFilter = ref('');
const actionFilter = ref('');
const openId = ref<number | null>(null);

onMounted(async () => {
  entries.value = await getAuditLog();
  loading.value = false;
});

const tables = computed(() => [...new Set(entries.value.map((e) => e.table_name))].sort());

const filtered = computed(() =>
  entries.value.filter(
    (e) =>
      (!tableFilter.value || e.table_name === tableFilter.value) &&
      (!actionFilter.value || e.action === actionFilter.value)
  )
);

function toggle(id: number) {
  openId.value = openId.value === id ? null : id;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function who(e: AuditEntry) {
  if (e.actor_email) return e.actor_email;
  return e.actor_role === 'service_role' ? 'system' : 'admin';
}

const label = (a: string) => ({INSERT: 'Create', UPDATE: 'Update', DELETE: 'Delete'})[a] ?? a;
const actionClass = (a: string) =>
  ({INSERT: 'action-badge--green', UPDATE: 'action-badge--blue', DELETE: 'action-badge--red'})[a] ?? '';

function shortId(id: string | null) {
  if (!id) return '—';
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 0.35rem;
}

.hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.25rem;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.filter-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.85rem;
  color: #1e293b;
  background: #fff;
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
  padding: 0.6rem 0.9rem;
  background: #f1f5f9;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.admin-table td {
  padding: 0.55rem 0.9rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #334155;
  vertical-align: middle;
}

.nowrap {
  white-space: nowrap;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #64748b;
}

.action-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
}

.action-badge--green { background: #dcfce7; color: #166534; }
.action-badge--blue { background: #dbeafe; color: #1e40af; }
.action-badge--red { background: #fee2e2; color: #b91c1c; }

.admin-link {
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.admin-link:hover {
  text-decoration: underline;
}

.detail-row td {
  background: #fbfcfe;
}

.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.diff-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  margin: 0 0 0.35rem;
}

.diff-pre {
  margin: 0;
  padding: 0.6rem 0.75rem;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.74rem;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 22rem;
}

@media (max-width: 700px) {
  .diff-grid {
    grid-template-columns: 1fr;
  }
}
</style>
