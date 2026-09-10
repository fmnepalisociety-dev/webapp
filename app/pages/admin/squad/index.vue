<template>
  <div>
    <div class="members-header">
      <h1 class="admin-page-title">Tournaments</h1>
    </div>

    <p class="page-intro">Pick a tournament to manage its squads.</p>

    <div class="tournament-grid">
      <NuxtLink
        v-for="t in TOURNAMENTS"
        :key="t.key"
        :to="`/admin/squad/${t.key}`"
        class="tournament-card"
      >
        <div class="tournament-card-head">
          <font-awesome-icon :icon="['fas', 'trophy']" class="tournament-icon" />
          <div>
            <h2 class="tournament-name">{{ t.name }}</h2>
            <p class="tournament-sport">{{ t.sport }}</p>
          </div>
        </div>

        <ul class="team-chips">
          <li v-for="tm in t.teams" :key="tm.key" :class="['team-chip', `team-chip--${tm.kind}`]">
            <span class="team-chip-label">{{ tm.label }}</span>
            <span class="team-chip-count">
              {{ loading ? '…' : counts[`${t.key}:${tm.key}`] ?? 0 }}
            </span>
          </li>
        </ul>

        <span class="tournament-cta">
          Manage squads
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {getSquad, TOURNAMENTS} from '~/composables/useSquad';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
// Player counts keyed by `${tournamentKey}:${teamKey}`.
const counts = ref<Record<string, number>>({});

onMounted(async () => {
  for (const t of TOURNAMENTS) {
    for (const tm of t.teams) {
      const players = await getSquad(t.sport, tm.team);
      counts.value[`${t.key}:${tm.key}`] = players.length;
    }
  }
  loading.value = false;
});
</script>

<style scoped>
.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.page-intro {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.tournament-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1.25rem;
}

.tournament-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.tournament-card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #c7d2fe;
}

.tournament-card-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.tournament-icon {
  font-size: 1.4rem;
  width: 2.6rem;
  height: 2.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.tournament-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.tournament-sport {
  font-size: 0.78rem;
  color: #94a3b8;
  text-transform: capitalize;
  margin: 0.1rem 0 0;
}

.team-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.team-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.team-chip--home {
  background: #e0e7ff;
  color: #3730a3;
}

.team-chip--opponent {
  background: #fee2e2;
  color: #991b1b;
}

.team-chip-count {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 0.05rem 0.45rem;
}

.tournament-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: auto;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
