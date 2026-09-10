<template>
  <main class="ec-page">
    <header class="ec-hero">
      <div class="ec-hero-icon">
        <font-awesome-icon :icon="['fas', 'futbol']" />
      </div>
      <div>
        <p class="ec-kicker">Football</p>
        <h1 class="ec-title">{{ tournament?.name ?? 'Everest Cup 2026' }}</h1>
        <p class="ec-sub">NeSFM vs NSA — meet both squads</p>
      </div>
    </header>

    <TournamentSquads v-if="tournament" :tournament="tournament" />
  </main>
</template>

<script setup lang="ts">
import {getTournament} from '~/composables/useSquad';

const tournament = getTournament('everest-cup-2026');

useHead({title: 'Everest Cup 2026 — NeSFM vs NSA'});
</script>

<style scoped>
.ec-page {
  max-width: 74rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.ec-hero {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1.5rem;
  border-radius: 0.9rem;
  background: linear-gradient(120deg, rgba(28, 51, 130, 0.95), rgba(163, 20, 50, 0.9));
  color: #fff;
  margin-bottom: 1.75rem;
}

.ec-hero-icon {
  font-size: 2.4rem;
  width: 3.6rem;
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  flex-shrink: 0;
}

.ec-kicker {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.ec-title {
  margin: 0.1rem 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.ec-sub {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

@media (max-width: 520px) {
  .ec-page {
    padding: 1rem;
  }
  .ec-title {
    font-size: 1.4rem;
  }
}
</style>
