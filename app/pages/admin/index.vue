<template>
  <div>
    <h1 class="admin-page-title">Dashboard</h1>
    <div class="admin-cards">
      <NuxtLink to="/admin/events" class="admin-card">
        <font-awesome-icon :icon="['fas', 'calendar-days']" class="admin-card-icon" />
        <span class="admin-card-label">Events</span>
        <span class="admin-card-desc">View events &amp; RSVPs</span>
      </NuxtLink>
      <NuxtLink to="/admin/flyers" class="admin-card">
        <font-awesome-icon :icon="['fas', 'image']" class="admin-card-icon" />
        <span class="admin-card-label">Flyers</span>
        <span class="admin-card-desc">Manage homepage flyers</span>
      </NuxtLink>
      <NuxtLink to="/admin/members" class="admin-card">
        <font-awesome-icon :icon="['fas', 'users']" class="admin-card-icon" />
        <span class="admin-card-label">Members</span>
        <span class="admin-card-desc">Add &amp; edit members</span>
      </NuxtLink>
      <!-- TODO: enable when admin CRUD is built
      <NuxtLink to="/admin/committee" class="admin-card">
        <font-awesome-icon :icon="['fas', 'user-tie']" class="admin-card-icon" />
        <span class="admin-card-label">Committee</span>
        <span class="admin-card-desc">Manage committee</span>
      </NuxtLink>
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' });
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.admin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: #1e293b;
  transition: box-shadow 0.15s;
}

.admin-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.admin-card-icon {
  font-size: 1.75rem;
  color: #0033a0;
}

.admin-card-label {
  font-weight: 700;
  font-size: 1.05rem;
}

.admin-card-desc {
  font-size: 0.8rem;
  color: #64748b;
}
</style>
