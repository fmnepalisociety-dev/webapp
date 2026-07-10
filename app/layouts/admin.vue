<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <NuxtLink to="/admin">NeSFM Admin</NuxtLink>
      </div>
      <nav class="admin-nav">
        <NuxtLink to="/admin/events" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'calendar-days']" />
          Events
        </NuxtLink>
        <NuxtLink to="/admin/flyers" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'image']" />
          Flyers
        </NuxtLink>
        <NuxtLink to="/admin/members" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'users']" />
          Members
        </NuxtLink>
        <!-- TODO: enable when admin CRUD is built
        <NuxtLink to="/admin/committee" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'user-tie']" />
          Committee
        </NuxtLink>
        -->
      </nav>
      <div class="admin-sidebar-footer">
        <NuxtLink to="/admin/change-password" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'key']" />
          Change Password
        </NuxtLink>
        <NuxtLink to="/" class="admin-nav-link">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          Back to Site
        </NuxtLink>
        <button class="admin-logout" @click="logout">
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          Logout
        </button>
      </div>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth();
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 220px;
  background: #1e293b;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.admin-brand {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #334155;
}

.admin-brand a {
  color: white;
  font-weight: 700;
  font-size: 1.15rem;
  text-decoration: none;
}

.admin-nav {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.admin-nav-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.admin-nav-link:hover {
  background: #334155;
  color: white;
}

.admin-nav-link.router-link-active {
  background: #334155;
  color: white;
  font-weight: 600;
}

.admin-sidebar-footer {
  border-top: 1px solid #334155;
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.admin-logout {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.admin-logout:hover {
  background: #334155;
  color: white;
}

.admin-main {
  flex: 1;
  background: #f8fafc;
  padding: 2rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-shell {
    flex-direction: column;
  }
  .admin-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .admin-brand {
    border-bottom: none;
    padding: 0.75rem 1rem;
  }
  .admin-nav {
    flex-direction: row;
    padding: 0 0.5rem 0.5rem;
    gap: 0;
    flex-wrap: wrap;
  }
  .admin-sidebar-footer {
    flex-direction: row;
    border-top: none;
    padding: 0 0.5rem 0.5rem;
    width: 100%;
  }
}
</style>
