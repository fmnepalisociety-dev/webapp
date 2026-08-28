<template>
  <div>
    <div class="events-header">
      <h1 class="admin-page-title">Banners</h1>
      <NuxtLink to="/admin/banners/new" class="admin-btn">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Banner
      </NuxtLink>
    </div>

    <div v-if="msg" class="save-msg save-msg--ok">{{ msg }}</div>

    <div v-if="loading" class="admin-loading">Loading banners...</div>

    <div v-else-if="!banners.length" class="admin-empty">
      No banners yet. Click "New Banner" to create one.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Banner</th>
          <th>Position</th>
          <th>Pages</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="banner in banners" :key="banner.id">
          <td>{{ banner.title || '(untitled)' }}</td>
          <td>{{ positionLabel(banner.position) }}</td>
          <td>{{ banner.scope === 'home' ? 'Home only' : 'All pages' }}</td>
          <td>
            <span v-if="isLive(banner)" class="admin-badge admin-badge--green">Live</span>
            <span v-else-if="banner.active" class="admin-badge admin-badge--blue">Scheduled</span>
            <span v-else class="admin-badge admin-badge--gray">Off</span>
          </td>
          <td class="actions-cell">
            <NuxtLink :to="`/admin/banners/${banner.id}/edit`" class="admin-link">Edit</NuxtLink>
            <button class="admin-link admin-link--danger" @click="remove(banner)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {getBanners, deleteBanner} from '~/composables/useBanners';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
const banners = ref<any[]>([]);
const msg = ref('');

onMounted(async () => {
  await load();
  loading.value = false;
});

async function load() {
  banners.value = await getBanners();
}

function positionLabel(pos: string) {
  return {
    page_top: 'Top of page',
    above_nav: 'Above nav',
    below_nav: 'Below nav',
  }[pos] ?? pos;
}

function isLive(banner: any) {
  if (!banner.active) return false;
  const now = Date.now();
  if (banner.start_at && new Date(banner.start_at).getTime() > now) return false;
  if (banner.end_at && new Date(banner.end_at).getTime() < now) return false;
  return true;
}

async function remove(banner: any) {
  if (!confirm(`Delete banner "${banner.title || 'untitled'}"? This cannot be undone.`)) return;
  const {error} = await deleteBanner(banner.id);
  if (error) {
    alert('Failed to delete banner.');
    return;
  }
  await load();
  msg.value = 'Banner deleted.';
  setTimeout(() => (msg.value = ''), 4000);
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.events-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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

.save-msg {
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.save-msg--ok {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
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
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}

.admin-badge--green {
  background: #dcfce7;
  color: #166534;
}

.admin-badge--blue {
  background: #dbeafe;
  color: #1e40af;
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
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.admin-link:hover {
  text-decoration: underline;
}

.admin-link--danger {
  color: #dc2626;
}

.actions-cell {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}
</style>
